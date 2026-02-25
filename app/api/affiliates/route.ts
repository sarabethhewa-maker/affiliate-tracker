import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const affiliates = await prisma.affiliate.findMany({
    include: { clicks: true, conversions: true, children: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(affiliates);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const affiliate = await prisma.affiliate.create({
    data: {
      name: body.name,
      email: body.email,
      tier: body.tier ?? 'silver',
      parentId: body.parentId ?? null,
    },
  });

  return NextResponse.json(affiliate);
}
