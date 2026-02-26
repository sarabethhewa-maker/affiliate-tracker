import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { getSettings, getTierIndexForRevenue } from '@/lib/settings';

export type LeaderboardEntry = {
  rank: number;
  affiliateId: string;
  name: string;
  tierLabel: string;
  salesThisMonth: number;
  totalSales: number;
  recruitsCount: number;
};

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress;
  if (!email) return NextResponse.json({ error: 'No email' }, { status: 400 });

  const url = new URL(req.url);
  const mode = (url.searchParams.get('mode') || 'month') as 'month' | 'all' | 'recruits';

  const settings = await getSettings();
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const affiliates = await prisma.affiliate.findMany({
    where: { status: 'active', deletedAt: null, archivedAt: null },
    include: { conversions: true, children: true },
  });

  const ranked = affiliates
    .map((a) => {
      const salesThisMonth = a.conversions
        .filter((c) => new Date(c.createdAt) >= thisMonthStart)
        .reduce((s, c) => s + c.amount, 0);
      const totalSales = a.conversions.reduce((s, c) => s + c.amount, 0);
      const recruitsCount = a.children.length;
      const tierIndex = getTierIndexForRevenue(
        a.conversions
          .filter((c) => {
            const d = new Date(c.createdAt);
            return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
          })
          .reduce((s, c) => s + c.amount, 0),
        settings.tiers
      );
      const tierLabel = settings.tiers[tierIndex]?.name ?? 'Affiliate';
      return {
        affiliateId: a.id,
        name: a.name,
        tierLabel,
        salesThisMonth,
        totalSales,
        recruitsCount,
      };
    })
    .sort((a, b) => {
      if (mode === 'month') return b.salesThisMonth - a.salesThisMonth;
      if (mode === 'all') return b.totalSales - a.totalSales;
      return b.recruitsCount - a.recruitsCount;
    })
    .map((r, i) => ({ ...r, rank: i + 1 }));

  const top10: LeaderboardEntry[] = ranked.slice(0, 10).map((r) => ({
    rank: r.rank,
    affiliateId: r.affiliateId,
    name: r.name,
    tierLabel: r.tierLabel,
    salesThisMonth: r.salesThisMonth,
    totalSales: r.totalSales,
    recruitsCount: r.recruitsCount,
  }));

  const me = await prisma.affiliate.findFirst({
    where: { email: email.trim().toLowerCase(), deletedAt: null },
  });
  let myRank: LeaderboardEntry | null = null;
  if (me) {
    const idx = ranked.findIndex((r) => r.affiliateId === me.id);
    if (idx >= 0) {
      const r = ranked[idx];
      myRank = {
        rank: r.rank,
        affiliateId: r.affiliateId,
        name: r.name,
        tierLabel: r.tierLabel,
        salesThisMonth: r.salesThisMonth,
        totalSales: r.totalSales,
        recruitsCount: r.recruitsCount,
      };
    }
  }

  return NextResponse.json({ top10, myRank, mode });
}
