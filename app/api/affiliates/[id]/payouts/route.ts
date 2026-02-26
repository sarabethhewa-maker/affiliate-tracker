import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { submitPayment } from '@/lib/tipalti';
import { logActivity } from '@/lib/activity';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;

  const affiliateId = (await params).id;
  const payouts = await prisma.payout.findMany({
    where: { affiliateId },
    orderBy: { paidAt: 'desc' },
  });
  return NextResponse.json(payouts);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;

  const affiliateId = (await params).id;
  const body = await req.json();
  const amount = Number(body.amount);
  const method = (body.method ?? 'other') as string;
  const note = body.note ?? null;

  const affiliate = await prisma.affiliate.findUnique({ where: { id: affiliateId } });
  if (!affiliate) return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });

  const isTipalti = method === 'tipalti';
  const idap = affiliate.tipaltiPayeeId ?? affiliate.id;

  const payout = await prisma.payout.create({
    data: {
      affiliateId,
      amount,
      method: method === 'tipalti' ? 'tipalti' : method,
      note,
      tipaltiRefCode: null,
      payoutStatus: isTipalti ? 'pending' : null,
    },
    include: { affiliate: true },
  });

  const refCode = payout.id;
  await prisma.payout.update({
    where: { id: payout.id },
    data: { tipaltiRefCode: refCode },
  });

  if (isTipalti) {
    try {
      await submitPayment(idap, amount, 'USD', refCode);
    } catch (e) {
      await prisma.payout.update({
        where: { id: payout.id },
        data: { payoutStatus: 'failed', note: [note, e instanceof Error ? e.message : 'Tipalti failed'].filter(Boolean).join(' — ') },
      });
      return NextResponse.json(
        { error: e instanceof Error ? e.message : 'Tipalti payment failed', payout },
        { status: 400 }
      );
    }
  }

  await prisma.conversion.updateMany({
    where: { affiliateId, status: 'approved' },
    data: { status: 'paid', paidAt: new Date() },
  });

  await logActivity({
    type: 'payout',
    message: `${affiliate.name} was paid $${amount.toFixed(0)}`,
    affiliateId,
  });

  try {
    const { syncAffiliate } = await import('@/lib/emailMarketing');
    await syncAffiliate({ id: affiliate.id, name: affiliate.name, email: affiliate.email, tier: affiliate.tier });
  } catch {
    // non-blocking
  }

  return NextResponse.json({ ...payout, tipaltiRefCode: refCode });
}
