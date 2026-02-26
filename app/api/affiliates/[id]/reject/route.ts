import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;

  const id = (await params).id;
  const aff = await prisma.affiliate.findUnique({ where: { id } });
  if (!aff) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.$transaction([
    prisma.click.deleteMany({ where: { affiliateId: id } }),
    prisma.conversion.deleteMany({ where: { affiliateId: id } }),
    prisma.payout.deleteMany({ where: { affiliateId: id } }),
    prisma.affiliate.updateMany({ where: { parentId: id }, data: { parentId: null } }),
    prisma.affiliate.delete({ where: { id } }),
  ]);
  return NextResponse.json({ ok: true });
}
