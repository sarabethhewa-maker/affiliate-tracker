import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const err = await requireAdmin();
  if (err) return err;

  const url = new URL(req.url);
  const resolvedParam = url.searchParams.get('resolved');
  const where: { resolved?: boolean } = {};
  if (resolvedParam === 'true') where.resolved = true;
  if (resolvedParam === 'false') where.resolved = false;

  const flags = await prisma.fraudFlag.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { affiliate: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json(flags);
}
