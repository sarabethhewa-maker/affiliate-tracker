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

  const affiliate = await prisma.affiliate.findFirst({
    where: { slug, deletedAt: null, archivedAt: null },
    select: { id: true, name: true },
  });

  if (!affiliate) {
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
