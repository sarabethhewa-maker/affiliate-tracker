import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const err = await requireAdmin();
  if (err) return err;

  const logs = await prisma.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return NextResponse.json(logs);
}
