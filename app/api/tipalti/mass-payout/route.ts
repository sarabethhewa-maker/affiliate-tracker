import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getSettings, getTierIndexForRevenue, type TierRow } from '@/lib/settings';
import { submitPayment } from '@/lib/tipalti';

type PaymentItem = { affiliateId: string; amount: number };

function getApprovedAmount(
  aff: { id: string; conversions: { amount: number; status: string; createdAt: Date }[]; tier: string },
  allAffiliates: { id: string; parentId: string | null; conversions: { amount: number; status: string }[]; tier: string }[],
  settings: { tiers: TierRow[] }
): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthlyRevenue = aff.conversions
    .filter((c) => {
      const d = new Date(c.createdAt);
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .reduce((s, c) => s + c.amount, 0);
  const tierIndex = getTierIndexForRevenue(monthlyRevenue, settings.tiers);
  const tier = settings.tiers[tierIndex];
  const rate = tier?.commission ?? 10;
  const mlm2 = tier?.mlm2 ?? 3;
  const approvedOwn = aff.conversions
    .filter((c) => c.status === 'approved')
    .reduce((s, c) => s + c.amount * (rate / 100), 0);
  const children = allAffiliates.filter((a) => a.parentId === aff.id);
  const mlmApproved = children.reduce(
    (s, c) =>
      s +
      c.conversions
        .filter((cv) => cv.status === 'approved')
        .reduce((x, cv) => x + cv.amount * (mlm2 / 100), 0),
    0
  );
  return approvedOwn + mlmApproved;
}

export async function POST(req: NextRequest) {
  const err = await requireAdmin();
  if (err) return err;

  const body = await req.json().catch(() => ({}));
  let payments: PaymentItem[] = [];
  if (Array.isArray(body.payments) && body.payments.length > 0) {
    payments = body.payments as PaymentItem[];
  } else if (Array.isArray(body.affiliateIds)) {
    const affiliateIds = body.affiliateIds as string[];
    const activeWhere = { status: 'active' as const, deletedAt: null, archivedAt: null };
    const affiliates = await prisma.affiliate.findMany({
      where: { id: { in: affiliateIds }, ...activeWhere },
      include: { conversions: true },
    });
    const allActive = await prisma.affiliate.findMany({
      where: activeWhere,
      include: { conversions: true },
    });
    const settings = await getSettings();
    for (const aff of affiliates) {
      const amount = getApprovedAmount(aff, allActive, settings);
      if (amount > 0) payments.push({ affiliateId: aff.id, amount });
    }
  }

  if (payments.length === 0) {
    return NextResponse.json({ error: 'No payments to process' }, { status: 400 });
  }

  const affiliateIds = payments.map((p) => p.affiliateId);
  const affiliates = await prisma.affiliate.findMany({
    where: { id: { in: affiliateIds }, status: 'active', deletedAt: null, archivedAt: null },
  });
  const affMap = new Map(affiliates.map((a) => [a.id, a]));

  const results: { affiliateId: string; success: boolean; payoutId?: string; error?: string }[] = [];

  for (const item of payments) {
    const amount = Number(item.amount) || 0;
    const aff = affMap.get(item.affiliateId);
    if (!aff) {
      results.push({ affiliateId: item.affiliateId, success: false, error: 'Affiliate not found' });
      continue;
    }
    if (amount <= 0) {
      results.push({ affiliateId: aff.id, success: false, error: 'Amount must be > 0' });
      continue;
    }
    if (aff.tipaltiStatus !== 'active') {
      results.push({ affiliateId: aff.id, success: false, error: 'Tipalti not active' });
      continue;
    }
    const idap = aff.tipaltiPayeeId ?? aff.id;

    const payout = await prisma.payout.create({
      data: {
        affiliateId: aff.id,
        amount,
        method: 'tipalti',
        tipaltiRefCode: null,
        payoutStatus: 'pending',
      },
    });
    const refCode = payout.id;
    await prisma.payout.update({
      where: { id: payout.id },
      data: { tipaltiRefCode: refCode },
    });

    try {
      await submitPayment(idap, amount, 'USD', refCode);
      await prisma.conversion.updateMany({
        where: { affiliateId: aff.id, status: 'approved' },
        data: { status: 'paid', paidAt: new Date() },
      });
      try {
        const { syncAffiliate } = await import('@/lib/emailMarketing');
        await syncAffiliate({ id: aff.id, name: aff.name, email: aff.email, tier: aff.tier });
      } catch {
        // non-blocking
      }
      results.push({ affiliateId: aff.id, success: true, payoutId: payout.id });
    } catch (e) {
      await prisma.payout.update({
        where: { id: payout.id },
        data: { payoutStatus: 'failed', note: e instanceof Error ? e.message : 'Tipalti failed' },
      });
      results.push({
        affiliateId: aff.id,
        success: false,
        payoutId: payout.id,
        error: e instanceof Error ? e.message : 'Payment failed',
      });
    }
  }

  return NextResponse.json({ results });
}
