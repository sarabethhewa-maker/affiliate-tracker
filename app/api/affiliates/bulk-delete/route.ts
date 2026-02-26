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

  await prisma.$transaction(async (tx) => {
    await tx.alert.deleteMany({ where: { affiliateId: { in: affiliateIds } } });
    await tx.activityLog.updateMany({ where: { affiliateId: { in: affiliateIds } }, data: { affiliateId: null } });
    for (const id of affiliateIds) {
      await tx.affiliate.delete({ where: { id } });
    }
  });

  return NextResponse.json({ ok: true, deleted: affiliateIds.length });
}
