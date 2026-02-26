import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkClickAnomaly } from '@/lib/alerts';
import { sendAlertEmail } from '@/lib/email';

const COOKIE_DAYS = 30;
const REDIRECT_URL = 'https://biolongevitylabs.com';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const slug = (await params).slug;
  if (!slug) {
    return NextResponse.redirect(REDIRECT_URL);
  }

  let affiliate = await prisma.affiliate.findFirst({
    where: { slug, deletedAt: null, archivedAt: null },
    select: { id: true, name: true, slug: true },
  });

  if (!affiliate) {
    const history = await prisma.slugHistory.findFirst({
      where: { oldSlug: slug },
      select: { affiliateId: true },
    });
    if (history) {
      const current = await prisma.affiliate.findUnique({
        where: { id: history.affiliateId, deletedAt: null, archivedAt: null },
        select: { slug: true },
      });
      if (current?.slug) {
        const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
        const protocol = req.headers.get('x-forwarded-proto') || 'https';
        if (host) {
          const newUrl = `${protocol === 'https' ? 'https' : 'http'}://${host}/ref/${current.slug}`;
          return NextResponse.redirect(newUrl, 301);
        }
      }
    }
    return NextResponse.redirect(REDIRECT_URL);
  }

  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? '';

  try {
    await prisma.click.create({
      data: {
        affiliateId: affiliate.id,
        ip: ip.slice(0, 255),
        userAgent: req.headers.get('user-agent') ?? '',
      },
    });
    const alert = await checkClickAnomaly(affiliate.id, ip);
    if (alert) {
      sendAlertEmail(affiliate.name ?? 'Unknown', alert.message).catch(() => {});
    }
  } catch {
    // still redirect
  }

  const expires = new Date();
  expires.setDate(expires.getDate() + COOKIE_DAYS);
  const response = NextResponse.redirect(REDIRECT_URL);
  response.cookies.set('ref', affiliate.id, {
    expires,
    sameSite: 'none',
    secure: true,
    path: '/',
    httpOnly: false,
  });
  return response;
}
