import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress;
  if (!email) return NextResponse.json({ error: 'No email' }, { status: 400 });

  const affiliate = await prisma.affiliate.findUnique({
    where: { email: email.trim().toLowerCase(), deletedAt: null },
    select: { id: true, status: true },
  });
  if (!affiliate || affiliate.status !== 'active') {
    return NextResponse.json({ error: 'Affiliate not found or not active' }, { status: 403 });
  }

  const links = await prisma.generatedLink.findMany({
    where: { affiliateId: affiliate.id },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(links);
}
