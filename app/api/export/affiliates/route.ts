import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function formatDate(d: Date): string {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const y = d.getFullYear();
  return `${m.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${y}`;
}

export async function GET() {
  const err = await requireAdmin();
  if (err) return err;

  const affiliates = await prisma.affiliate.findMany({
    include: { clicks: true, conversions: true },
    orderBy: { createdAt: 'desc' },
  });

  const headers = ['Name', 'Email', 'Tier', 'Revenue', 'Clicks', 'Conversions', 'Joined Date'];
  const rows = affiliates.map((a) => {
    const revenue = a.conversions.reduce((s, c) => s + c.amount, 0);
    return [
      a.name,
      a.email,
      a.tier,
      revenue.toFixed(2),
      String(a.clicks.length),
      String(a.conversions.length),
      formatDate(a.createdAt),
    ];
  });

  const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="affiliates.csv"',
    },
  });
}
