import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const err = await requireAdmin();
    if (err) return err;

    const affiliates = await prisma.affiliate.findMany({
      include: { clicks: true, conversions: true, children: true, payouts: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(affiliates);
  } catch (e) {
    console.error('[api/affiliates] GET', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const err = await requireAdmin();
  if (err) return err;

  const body = await req.json();
  const affiliate = await prisma.affiliate.create({
    data: {
      name: body.name,
      email: body.email,
      tier: body.tier ?? 'silver',
      parentId: body.parentId ?? null,
      state: body.state ?? null,
    },
  });

  return NextResponse.json(affiliate);
}
