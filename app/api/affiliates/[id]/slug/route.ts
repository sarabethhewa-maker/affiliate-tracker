import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isValidSlug, sanitizeSlug } from '@/lib/slug';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;

  const id = (await params).id;
  const body = await req.json();
  const rawSlug = typeof body.newSlug === 'string' ? body.newSlug : '';
  const newSlug = sanitizeSlug(rawSlug);

  if (!newSlug || !isValidSlug(newSlug)) {
    return NextResponse.json(
      { error: 'Slug must be at least 3 characters, lowercase letters, numbers, and hyphens only' },
      { status: 400 }
    );
  }

  const affiliate = await prisma.affiliate.findUnique({
    where: { id, deletedAt: null },
    select: { id: true, slug: true },
  });
  if (!affiliate) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const takenByAffiliate = await prisma.affiliate.findFirst({
    where: { slug: newSlug, NOT: { id } },
  });
  if (takenByAffiliate) {
    return NextResponse.json({ error: 'This link name is already taken' }, { status: 409 });
  }

  const takenInHistory = await prisma.slugHistory.findFirst({
    where: { oldSlug: newSlug },
  });
  if (takenInHistory) {
    return NextResponse.json({ error: 'This link name was used before and is reserved for redirects' }, { status: 409 });
  }

  const oldSlug = affiliate.slug;

  await prisma.$transaction(async (tx) => {
    if (oldSlug) {
      await tx.slugHistory.create({
        data: { affiliateId: id, oldSlug },
      });
    }
    await tx.affiliate.update({
      where: { id },
      data: { slug: newSlug },
    });
  });

  const updated = await prisma.affiliate.findUnique({
    where: { id },
    include: { clicks: true, conversions: true, children: true, payouts: true, slugHistory: true },
  });
  return NextResponse.json(updated);
}
