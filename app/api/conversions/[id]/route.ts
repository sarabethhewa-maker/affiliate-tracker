import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;

  const id = (await params).id;
  const body = await req.json();

  const data: { status?: string; paidAt?: Date } = {};
  if (body.status) data.status = body.status;
  if (body.status === 'paid') data.paidAt = new Date();

  const conversion = await prisma.conversion.update({
    where: { id },
    data,
    include: { affiliate: true },
  });

  return NextResponse.json(conversion);
}
