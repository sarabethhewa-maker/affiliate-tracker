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
  const aff = await prisma.affiliate.findUnique({
    where: { id, deletedAt: null },
    select: { id: true, archivedAt: true },
  });
  if (!aff) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = await prisma.affiliate.update({
    where: { id },
    data: { archivedAt: aff.archivedAt ? null : new Date() },
    include: { clicks: true, conversions: true, children: true, payouts: true },
  });
  return NextResponse.json(updated);
}
