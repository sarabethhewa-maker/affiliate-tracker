import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const event = (body.event ?? body.type ?? '').toString();
    const refCode = (body.refCode ?? body.reference ?? body.payment_ref ?? body.id ?? body.paymentId ?? '').toString();
    const status = (body.status ?? body.payment_status ?? '').toString().toLowerCase();

    if (!refCode) return NextResponse.json({ received: true });

    const payout = await prisma.payout.findFirst({
      where: { tipaltiRefCode: refCode },
    });
    if (!payout) return NextResponse.json({ received: true });

    if (event === 'payment_status_changed' || event === 'payment_confirmed' || status === 'paid' || status === 'cleared' || status === 'confirmed') {
      const updated = await prisma.payout.update({
        where: { id: payout.id },
        data: { payoutStatus: 'confirmed' },
        include: { affiliate: true },
      });
      try {
        const { syncAffiliate } = await import('@/lib/emailMarketing');
        if (updated.affiliate) {
          await syncAffiliate({
            id: updated.affiliate.id,
            name: updated.affiliate.name,
            email: updated.affiliate.email,
            tier: updated.affiliate.tier,
          });
        }
      } catch {
        // non-blocking
      }
    } else if (status === 'failed' || status === 'rejected' || status === 'voided') {
      await prisma.payout.update({
        where: { id: payout.id },
        data: { payoutStatus: 'failed' },
      });
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ received: true });
  }
}
