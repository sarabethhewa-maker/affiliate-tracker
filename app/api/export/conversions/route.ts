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

  const conversions = await prisma.conversion.findMany({
    include: { affiliate: true },
    orderBy: { createdAt: 'desc' },
  });

  const headers = ['Affiliate Name', 'Amount', 'Date', 'Source', 'Order ID'];
  const rows = conversions.map((c) => [
    c.affiliate.name,
    c.amount.toFixed(2),
    formatDate(c.createdAt),
    c.source ?? '',
    c.orderId ?? '',
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="conversions.csv"',
    },
  });
}
