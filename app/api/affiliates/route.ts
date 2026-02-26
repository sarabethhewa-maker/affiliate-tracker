import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateUniqueSlug, slugFromName } from '@/lib/slug';

export async function GET(req: Request) {
  try {
    const err = await requireAdmin();
    if (err) return err;

    const url = new URL(req.url);
    const showArchived = url.searchParams.get('showArchived') === 'true';

    const affiliates = await prisma.affiliate.findMany({
      where: {
        deletedAt: null,
        ...(showArchived ? {} : { archivedAt: null }),
      },
      include: { clicks: true, conversions: true, children: true, payouts: true, fraudFlags: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(affiliates);
  } catch (e) {
    console.error('[api/affiliates] GET', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const err = await requireAdmin();
  if (err) return err;

  const body = await req.json();
  const slug = await generateUniqueSlug(prisma, slugFromName(body.name ?? body.email ?? 'affiliate'));
  const affiliate = await prisma.affiliate.create({
    data: {
      name: body.name,
      email: body.email,
      slug,
      tier: body.tier ?? 'silver',
      parentId: body.parentId ?? null,
      state: body.state ?? null,
    },
  });

  return NextResponse.json(affiliate);
}
