import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const err = await requireAdmin();
  if (err) return err;

  const body = await req.json();
  const affiliateIds = Array.isArray(body.affiliateIds) ? body.affiliateIds as string[] : [];
  if (affiliateIds.length === 0) {
    return NextResponse.json({ error: 'affiliateIds array is required' }, { status: 400 });
  }

  const now = new Date();
  await prisma.affiliate.updateMany({
    where: { id: { in: affiliateIds }, deletedAt: null },
    data: { archivedAt: now },
  });

  return NextResponse.json({ ok: true, archived: affiliateIds.length });
}
