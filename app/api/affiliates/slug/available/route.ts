import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isValidSlug, sanitizeSlug } from '@/lib/slug';

export async function GET(req: NextRequest) {
  const err = await requireAdmin();
  if (err) return err;

  const slug = req.nextUrl.searchParams.get('slug');
  const raw = slug ? sanitizeSlug(slug) : '';
  if (!raw || !isValidSlug(raw)) {
    return NextResponse.json({ available: false, valid: false });
  }

  const excludeId = req.nextUrl.searchParams.get('excludeId') ?? undefined;
  const existingAffiliate = await prisma.affiliate.findFirst({
    where: {
      slug: raw,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });
  if (existingAffiliate) return NextResponse.json({ available: false, valid: true });

  const inHistory = await prisma.slugHistory.findFirst({
    where: { oldSlug: raw },
  });
  if (inHistory) return NextResponse.json({ available: false, valid: true });

  return NextResponse.json({ available: true, valid: true });
}
