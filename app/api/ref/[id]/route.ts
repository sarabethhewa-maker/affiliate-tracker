import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkClickAnomaly } from '@/lib/alerts';
import { sendAlertEmail } from '@/lib/email';

const COOKIE_DAYS = 30;
const REDIRECT_URL = 'https://biolongevitylabs.com';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const affiliateId = (await params).id;
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? '';

  try {
    await prisma.click.create({
      data: {
        affiliateId,
        ip: ip.slice(0, 255),
        userAgent: req.headers.get('user-agent') ?? '',
      },
    });
    const alert = await checkClickAnomaly(affiliateId, ip);
    if (alert) {
      const aff = await prisma.affiliate.findUnique({ where: { id: affiliateId }, select: { name: true } });
      sendAlertEmail(aff?.name ?? 'Unknown', alert.message).catch(() => {});
    }
  } catch {
    // affiliate not found, still redirect
  }

  const expires = new Date();
  expires.setDate(expires.getDate() + COOKIE_DAYS);
  const response = NextResponse.redirect(REDIRECT_URL);
  response.cookies.set('ref', affiliateId, {
    expires,
    sameSite: 'none',
    secure: true,
    path: '/',
    httpOnly: false, // so WooCommerce/checkout can read it
  });
  return response;
}
