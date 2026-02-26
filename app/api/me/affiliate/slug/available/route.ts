import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { isValidSlug, sanitizeSlug } from '@/lib/slug';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress;
  if (!email) return NextResponse.json({ error: 'No email' }, { status: 400 });

  const affiliate = await prisma.affiliate.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true },
  });
  if (!affiliate) return NextResponse.json({ error: 'Not an affiliate' }, { status: 403 });

  const slug = req.nextUrl.searchParams.get('slug');
  const raw = slug ? sanitizeSlug(slug) : '';
  if (!raw || !isValidSlug(raw)) {
    return NextResponse.json({ available: false, valid: false });
  }

  const existing = await prisma.affiliate.findFirst({
    where: { slug: raw, NOT: { id: affiliate.id } },
  });
  return NextResponse.json({ available: !existing, valid: true });
}
