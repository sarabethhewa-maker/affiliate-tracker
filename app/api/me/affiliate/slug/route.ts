import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { isValidSlug, sanitizeSlug } from '@/lib/slug';

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress;
  if (!email) return NextResponse.json({ error: 'No email' }, { status: 400 });

  const affiliate = await prisma.affiliate.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (!affiliate) return NextResponse.json({ error: 'Not an affiliate' }, { status: 403 });

  const body = await req.json();
  const slug = sanitizeSlug(String(body.slug ?? ''));
  if (!isValidSlug(slug)) {
    return NextResponse.json(
      { error: 'Slug must be 3–30 characters, lowercase letters, numbers, and hyphens only' },
      { status: 400 }
    );
  }

  const taken = await prisma.affiliate.findFirst({
    where: { slug, NOT: { id: affiliate.id } },
  });
  if (taken) {
    return NextResponse.json({ error: 'This link name is already taken' }, { status: 409 });
  }

  const updated = await prisma.affiliate.update({
    where: { id: affiliate.id },
    data: { slug },
  });
  return NextResponse.json(updated);
}
