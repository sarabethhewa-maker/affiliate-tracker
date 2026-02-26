import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSettings, getTierIndexForRevenue } from '@/lib/settings';
import { sendWeeklyDigest } from '@/lib/email';

function getWeekRange(now: Date): { start: Date; end: Date } {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const start = new Date(now);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

function getPreviousWeekRange(now: Date): { start: Date; end: Date } {
  const end = new Date(now);
  end.setDate(end.getDate() - 7);
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const isTest = url.searchParams.get('test') === '1';

  const settings = await getSettings();
  const now = new Date();
  const thisWeek = getWeekRange(now);
  const lastWeek = getPreviousWeekRange(now);

  const conversions = await prisma.conversion.findMany({
    include: { affiliate: true },
  });

  const revenueThisWeek = conversions
    .filter((c) => {
      const d = new Date(c.createdAt);
      return d >= thisWeek.start && d <= thisWeek.end;
    })
    .reduce((s, c) => s + c.amount, 0);

  const revenueLastWeek = conversions
    .filter((c) => {
      const d = new Date(c.createdAt);
      return d >= lastWeek.start && d <= lastWeek.end;
    })
    .reduce((s, c) => s + c.amount, 0);

  const pctChange =
    revenueLastWeek > 0
      ? (((revenueThisWeek - revenueLastWeek) / revenueLastWeek) * 100).toFixed(1)
      : revenueThisWeek > 0
        ? '100'
        : '0';

  const newAffiliates = await prisma.affiliate.findMany({
    where: {
      createdAt: { gte: thisWeek.start, lte: thisWeek.end },
      deletedAt: null,
    },
    select: { name: true, email: true },
  });

  const affiliates = await prisma.affiliate.findMany({
    where: { status: 'active', deletedAt: null, archivedAt: null },
    include: { conversions: true, children: { include: { conversions: true } } },
  });

  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth();
  const monthlyRevenue: Record<string, number> = {};
  affiliates.forEach((a) => {
    monthlyRevenue[a.id] = a.conversions
      .filter((c) => {
        const d = new Date(c.createdAt);
        return d.getFullYear() === nowYear && d.getMonth() === nowMonth;
      })
      .reduce((s, c) => s + c.amount, 0);
  });

  const performerEarnings: { name: string; sales: number; earnings: number }[] = [];
  affiliates.forEach((a) => {
    const salesThisWeek = a.conversions
      .filter((c) => {
        const d = new Date(c.createdAt);
        return d >= thisWeek.start && d <= thisWeek.end;
      })
      .reduce((s, c) => s + c.amount, 0);
    if (salesThisWeek <= 0) return;
    const tierIndex = getTierIndexForRevenue(monthlyRevenue[a.id] ?? 0, settings.tiers);
    const rate = settings.tiers[tierIndex]?.commission ?? 10;
    const earnings = (salesThisWeek * rate) / 100;
    performerEarnings.push({ name: a.name, sales: salesThisWeek, earnings });
  });
  performerEarnings.sort((a, b) => b.sales - a.sales);
  const top3 = performerEarnings.slice(0, 3);

  let totalUnpaid = 0;
  affiliates.forEach((a) => {
    const tierIndex = getTierIndexForRevenue(monthlyRevenue[a.id] ?? 0, settings.tiers);
    const rate = settings.tiers[tierIndex]?.commission ?? 10;
    const mlm2 = settings.tiers[tierIndex]?.mlm2 ?? 3;
    const unpaidDirect = a.conversions
      .filter((c) => c.status !== 'paid')
      .reduce((s, c) => s + (c.amount * rate) / 100, 0);
    const unpaidMlm = a.children.reduce((s, child) => {
      const childUnpaid = child.conversions
        .filter((c) => c.status !== 'paid')
        .reduce((x, c) => x + (c.amount * mlm2) / 100, 0);
      return s + childUnpaid;
    }, 0);
    totalUnpaid += unpaidDirect + unpaidMlm;
  });

  const tierUpgrades = await prisma.activityLog.findMany({
    where: {
      type: 'tier_upgrade',
      createdAt: { gte: thisWeek.start, lte: thisWeek.end },
    },
    orderBy: { createdAt: 'desc' },
  });

  const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app';

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Weekly Digest</title></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 22px; margin-bottom: 8px;">Weekly Affiliate Digest</h1>
  <p style="color: #666; font-size: 14px; margin-bottom: 24px;">${thisWeek.start.toLocaleDateString()} – ${thisWeek.end.toLocaleDateString()}</p>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
    <tr style="background: #f8fafc;">
      <td style="padding: 12px; border: 1px solid #e2e8f0;"><strong>Revenue this week</strong></td>
      <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: right;">$${revenueThisWeek.toFixed(2)}</td>
    </tr>
    <tr>
      <td style="padding: 12px; border: 1px solid #e2e8f0;">vs last week</td>
      <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: right;">${Number(pctChange) >= 0 ? '+' : ''}${pctChange}%</td>
    </tr>
  </table>

  <h2 style="font-size: 16px; margin-bottom: 8px;">New affiliates this week</h2>
  <p style="margin-bottom: 16px;">${newAffiliates.length} new signup${newAffiliates.length !== 1 ? 's' : ''}.</p>
  ${newAffiliates.length > 0 ? `<ul style="margin: 0 0 24px 0; padding-left: 20px;">${newAffiliates.map((a) => `<li>${a.name} — ${a.email}</li>`).join('')}</ul>` : ''}

  <h2 style="font-size: 16px; margin-bottom: 8px;">Top 3 performers this week</h2>
  ${top3.length > 0 ? `<ul style="margin: 0 0 24px 0; padding-left: 20px;">${top3.map((p, i) => `<li><strong>${p.name}</strong> — $${p.sales.toFixed(2)} sales, $${p.earnings.toFixed(2)} earnings</li>`).join('')}</ul>` : '<p style="margin-bottom: 24px;">No sales this week.</p>'}

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
    <tr style="background: #fef3c7;">
      <td style="padding: 12px; border: 1px solid #e2e8f0;"><strong>Total commissions owed (unpaid)</strong></td>
      <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: right;">$${totalUnpaid.toFixed(2)}</td>
    </tr>
  </table>

  <h2 style="font-size: 16px; margin-bottom: 8px;">Tier upgrades this week</h2>
  ${tierUpgrades.length > 0 ? `<ul style="margin: 0 0 24px 0; padding-left: 20px;">${tierUpgrades.map((l) => `<li>${l.message}</li>`).join('')}</ul>` : '<p style="margin-bottom: 24px;">None.</p>'}

  <p style="margin-top: 24px;"><a href="${dashboardUrl}" style="display: inline-block; padding: 10px 20px; background: #1e3a5f; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">Open dashboard</a></p>
  ${isTest ? '<p style="margin-top: 16px; color: #666; font-size: 12px;">This was a test digest.</p>' : ''}
</body>
</html>
`;

  await sendWeeklyDigest(html);
  return NextResponse.json({ ok: true, test: isTest });
}
