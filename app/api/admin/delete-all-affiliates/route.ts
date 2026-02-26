import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const CONFIRMATION_PHRASE = 'DELETE ALL AFFILIATES';

export async function POST(req: NextRequest) {
  const err = await requireAdmin();
  if (err) return err;

  const body = await req.json();
  if (body.confirmation !== CONFIRMATION_PHRASE) {
    return NextResponse.json({ error: 'Invalid confirmation. Body must contain confirmation: "DELETE ALL AFFILIATES"' }, { status: 400 });
  }

  const count = await prisma.affiliate.count();
  console.log('[admin] delete-all-affiliates: initiated by admin, count=', count);

  await prisma.$transaction(async (tx) => {
    await tx.alert.deleteMany({});
    await tx.activityLog.updateMany({ data: { affiliateId: null } });
    const all = await tx.affiliate.findMany({ select: { id: true } });
    for (const a of all) {
      await tx.affiliate.delete({ where: { id: a.id } });
    }
  });

  console.log('[admin] delete-all-affiliates: completed, deleted', count, 'affiliates');
  return NextResponse.json({ ok: true, deleted: count });
}
