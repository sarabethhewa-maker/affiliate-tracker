import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { getSettings } from '@/lib/settings';

function getStoreBase(): string {
  const env = (process.env.WC_STORE_URL ?? '').trim().replace(/\/$/, '');
  if (env) return env;
  return 'https://biolongevitylabs.com';
}

function buildTrackedUrl(originalUrl: string, refParam: string): string {
  const ref = `ref=${encodeURIComponent(refParam)}`;
  try {
    const u = new URL(originalUrl);
    if (u.search) {
      u.search += '&' + ref;
    } else {
      u.search = '?' + ref;
    }
    return u.toString();
  } catch {
    return originalUrl + (originalUrl.includes('?') ? '&' : '?') + ref;
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress;
  if (!email) return NextResponse.json({ error: 'No email' }, { status: 400 });

  const affiliate = await prisma.affiliate.findUnique({
    where: { email: email.trim().toLowerCase(), deletedAt: null },
    select: { id: true, slug: true, status: true },
  });
  if (!affiliate || affiliate.status !== 'active') {
    return NextResponse.json({ error: 'Affiliate not found or not active' }, { status: 403 });
  }

  const body = await req.json();
  const rawUrl = typeof body.originalUrl === 'string' ? body.originalUrl.trim() : '';
  if (!rawUrl) return NextResponse.json({ error: 'originalUrl is required' }, { status: 400 });

  const settings = await getSettings();
  const storeBase = (settings.wcStoreUrl || getStoreBase()).replace(/\/$/, '').toLowerCase();
  let normalizedInput: string;
  try {
    const u = new URL(rawUrl);
    normalizedInput = u.origin.toLowerCase() + u.pathname + u.search;
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }
  const allowedOrigin = storeBase.startsWith('http') ? storeBase : `https://${storeBase}`;
  if (!normalizedInput.startsWith(allowedOrigin) && !normalizedInput.startsWith(storeBase)) {
    const withHttps = allowedOrigin;
    return NextResponse.json(
      { error: `URL must be from the store (e.g. ${withHttps})` },
      { status: 400 }
    );
  }

  const refValue = affiliate.slug || affiliate.id;
  const trackedUrl = buildTrackedUrl(rawUrl, refValue);

  const link = await prisma.generatedLink.create({
    data: {
      affiliateId: affiliate.id,
      originalUrl: rawUrl,
      trackedUrl,
    },
  });
  return NextResponse.json({ id: link.id, originalUrl: rawUrl, trackedUrl, createdAt: link.createdAt });
}
