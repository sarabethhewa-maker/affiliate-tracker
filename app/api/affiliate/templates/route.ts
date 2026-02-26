import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { getSettings } from '@/lib/settings';
import { seedMessageTemplatesIfEmpty } from '@/lib/seed-templates';

function fillPlaceholders(
  text: string,
  affiliateName: string,
  trackingLink: string,
  couponCode: string
): string {
  return text
    .replace(/\{\{affiliate_name\}\}/g, affiliateName)
    .replace(/\{\{tracking_link\}\}/g, trackingLink)
    .replace(/\{\{coupon_code\}\}/g, couponCode);
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress;
    if (!email) return NextResponse.json({ error: 'No email' }, { status: 401 });

    await seedMessageTemplatesIfEmpty();

    const affiliate = await prisma.affiliate.findUnique({
      where: { email: email.trim().toLowerCase(), deletedAt: null },
      select: { id: true, name: true, slug: true, couponCode: true, status: true },
    });

    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });
    }
    if (affiliate.status === 'pending') {
      return NextResponse.json({ error: 'Application pending' }, { status: 403 });
    }
    if (affiliate.status === 'rejected') {
      return NextResponse.json({ error: 'Application rejected' }, { status: 403 });
    }

    const settings = await getSettings();
    const baseUrl = (settings.websiteUrl || '').replace(/\/$/, '');
    const trackingLink = affiliate.slug
      ? `${baseUrl}/ref/${affiliate.slug}`
      : `${baseUrl}/api/ref/${affiliate.id}`;
    const couponCode = affiliate.couponCode
      ? `Use code ${affiliate.couponCode} for a discount!`
      : 'Ask me for a code!';
    const affiliateName = affiliate.name || 'Affiliate';

    const list = await prisma.messageTemplate.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    const filled = list.map((t) => ({
      id: t.id,
      title: t.title,
      category: t.category,
      subject: t.subject ? fillPlaceholders(t.subject, affiliateName, trackingLink, couponCode) : null,
      body: fillPlaceholders(t.body, affiliateName, trackingLink, couponCode),
    }));

    return NextResponse.json(filled);
  } catch (e) {
    console.error('[api/affiliate/templates] GET', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    );
  }
}
