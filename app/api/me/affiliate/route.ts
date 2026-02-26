import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { getSettings, getTierIndexForRevenue } from '@/lib/settings';
import { isAdmin } from '@/lib/settings';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress;
    if (!email) return NextResponse.json({ pending: true, message: 'No email on account' }, { status: 200 });

    const url = new URL(req.url);
    const previewId = url.searchParams.get('preview');
    const settings = await getSettings();

  let affiliate: Awaited<ReturnType<typeof loadAffiliate>> | null = null;

  if (previewId) {
    const admin = await isAdmin(email);
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    affiliate = await loadAffiliate(previewId);
  } else {
    affiliate = await loadAffiliateByEmail(email);
  }

  if (!affiliate) {
    return NextResponse.json({ noApplication: true, email }, { status: 200 });
  }

  if (affiliate.status === 'pending') {
    return NextResponse.json({
      pending: true,
      message: 'Your application is under review',
      applicationDetails: {
        name: affiliate.name,
        email: affiliate.email,
        createdAt: affiliate.createdAt,
      },
    }, { status: 200 });
  }

  if (affiliate.status === 'rejected') {
    return NextResponse.json({ rejected: true, email }, { status: 200 });
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthlyRevenue = affiliate.conversions
    .filter((c) => {
      const d = new Date(c.createdAt);
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .reduce((s, c) => s + c.amount, 0);

  const tierIndex = getTierIndexForRevenue(monthlyRevenue, settings.tiers);
  const tierRow = settings.tiers[tierIndex];
  const nextTier = settings.tiers[tierIndex + 1];
  const progress = nextTier ? Math.min(1, monthlyRevenue / nextTier.threshold) : 1;

  const totalEarned = affiliate.conversions
    .filter((c) => c.status === 'approved' || c.status === 'paid')
    .reduce((s, c) => {
      const rate = (tierRow?.commission ?? 10) / 100;
      return s + c.amount * rate;
    }, 0);

  const paidAmount = affiliate.conversions
    .filter((c) => c.status === 'paid')
    .reduce((s, c) => {
      const rate = (tierRow?.commission ?? 10) / 100;
      return s + c.amount * rate;
    }, 0);

  const pendingPayout = totalEarned - paidAmount;

  return NextResponse.json({
    affiliate: {
      id: affiliate.id,
      name: affiliate.name,
      email: affiliate.email,
      slug: affiliate.slug,
      tier: affiliate.tier,
      status: affiliate.status,
      referralCode: affiliate.referralCode,
      tipaltiStatus: affiliate.tipaltiStatus,
      socialHandle: affiliate.socialHandle,
      clicks: affiliate.clicks.length,
      conversions: affiliate.conversions,
      payouts: affiliate.payouts,
      children: affiliate.children.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        tier: c.tier,
        status: c.status,
        clicksCount: c.clicks.length,
        conversionsCount: c.conversions.length,
        totalSales: c.conversions.reduce((s, x) => s + x.amount, 0),
      })),
    },
    tiers: settings.tiers,
    programName: settings.programName,
    websiteUrl: settings.websiteUrl,
    tierIndex,
    commissionRate: tierRow?.commission ?? 10,
    monthlyRevenue,
    nextTierThreshold: nextTier?.threshold ?? null,
    progress,
    totalClicks: affiliate.clicks.length,
    totalSales: affiliate.conversions.reduce((s, c) => s + c.amount, 0),
    totalEarned,
    pendingPayout,
  });
  } catch (e) {
    console.error('[api/me/affiliate]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    );
  }
}

async function loadAffiliate(id: string) {
  return prisma.affiliate.findUnique({
    where: { id },
    include: {
      clicks: true,
      conversions: { orderBy: { createdAt: 'desc' } },
      payouts: { orderBy: { paidAt: 'desc' } },
      children: {
        include: {
          clicks: true,
          conversions: true,
        },
      },
    },
  });
}

async function loadAffiliateByEmail(email: string) {
  return prisma.affiliate.findUnique({
    where: { email: email.trim().toLowerCase() },
    include: {
      clicks: true,
      conversions: { orderBy: { createdAt: 'desc' } },
      payouts: { orderBy: { paidAt: 'desc' } },
      children: {
        include: {
          clicks: true,
          conversions: true,
        },
      },
    },
  });
}
