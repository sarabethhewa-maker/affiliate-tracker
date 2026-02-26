import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const id = (await params).id;
  const link = await prisma.generatedLink.findFirst({
    where: { id, affiliateId: affiliate.id },
  });
  if (!link) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.generatedLink.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
