import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';

export async function GET(req: NextRequest) {
  const err = await requireAdmin();
  if (err) return err;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status'); // pending | approved | paid
  const from = searchParams.get('from'); // YYYY-MM-DD
  const to = searchParams.get('to');
  const affiliateId = searchParams.get('affiliateId');

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (affiliateId) where.affiliateId = affiliateId;
  if (from || to) {
    where.createdAt = {};
    if (from) (where.createdAt as Record<string, Date>).gte = new Date(from + 'T00:00:00Z');
    if (to) (where.createdAt as Record<string, Date>).lte = new Date(to + 'T23:59:59.999Z');
  }

  const conversions = await prisma.conversion.findMany({
    where,
    include: { affiliate: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(conversions);
}

export async function POST(req: Request) {
  const err = await requireAdmin();
  if (err) return err;

  const body = await req.json();
  const createdAt = body.createdAt ? new Date(body.createdAt) : undefined;
  const conversion = await prisma.conversion.create({
    data: {
      affiliateId: body.affiliateId,
      amount: Number(body.amount),
      product: body.product ?? null,
      note: body.note ?? null,
      status: body.status ?? 'pending',
      orderId: body.orderId ?? null,
      source: body.source ?? 'manual',
      ...(createdAt && { createdAt }),
    },
    include: { affiliate: true },
  });

  await logActivity({
    type: 'conversion',
    message: `${conversion.affiliate.name} made a $${conversion.amount.toFixed(0)} sale`,
    affiliateId: conversion.affiliateId,
  });

  return NextResponse.json(conversion);
}
