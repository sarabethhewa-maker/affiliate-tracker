import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type OrderItem = { name?: string; quantity?: number; total?: string };

function getDateRange(period: string): { start: Date; end: Date } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  if (period === 'today') {
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }
  if (period === 'week') {
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }
  if (period === 'month') {
    start.setMonth(start.getMonth() - 1);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }
  if (period === 'year') {
    start.setFullYear(start.getFullYear() - 1);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }
  // all
  start.setTime(0);
  return { start, end };
}

export async function GET(req: NextRequest) {
  const err = await requireAdmin();
  if (err) return err;

  const url = new URL(req.url);
  const period = url.searchParams.get('period') ?? 'month';
  const { start, end } = getDateRange(period);

  const conversions = await prisma.conversion.findMany({
    where: {
      createdAt: { gte: start, lte: end },
    },
    select: { id: true, affiliateId: true, amount: true, orderItems: true },
  });

  const byName: Record<
    string,
    { units: number; revenue: number; affiliateIds: Set<string> }
  > = {};

  for (const c of conversions) {
    const raw = c.orderItems;
    const items: OrderItem[] = Array.isArray(raw) ? (raw as OrderItem[]) : [];
    const affiliateId = c.affiliateId;

    if (items.length === 0) {
      // No line items: treat whole conversion as one "product" for backward compat
      const name = 'Order (no line items)';
      if (!byName[name]) byName[name] = { units: 0, revenue: 0, affiliateIds: new Set() };
      byName[name].units += 1;
      byName[name].revenue += c.amount;
      byName[name].affiliateIds.add(affiliateId);
      continue;
    }

    for (const item of items) {
      const name =
        typeof item.name === 'string' && item.name.trim()
          ? item.name.trim()
          : 'Unknown product';
      const qty = typeof item.quantity === 'number' ? item.quantity : Number(item.quantity) || 1;
      const total = typeof item.total === 'string' ? parseFloat(item.total) : Number(item.total) || 0;
      if (Number.isNaN(total)) continue;

      if (!byName[name]) byName[name] = { units: 0, revenue: 0, affiliateIds: new Set() };
      byName[name].units += qty;
      byName[name].revenue += total;
      byName[name].affiliateIds.add(affiliateId);
    }
  }

  const list = Object.entries(byName).map(([productName, data]) => ({
    productName,
    unitsSold: data.units,
    revenue: Math.round(data.revenue * 100) / 100,
    uniqueAffiliates: data.affiliateIds.size,
  }));

  list.sort((a, b) => b.revenue - a.revenue);

  return NextResponse.json(list);
}
