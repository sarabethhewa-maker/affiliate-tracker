import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkClickAnomaly } from '@/lib/alerts';
import { checkFraudOnClick } from '@/lib/fraud';
import { sendAlertEmail } from '@/lib/email';

const COOKIE_DAYS = 30;
const REDIRECT_URL = 'https://biolongevitylabs.com';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const affiliateId = (await params).id;
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? '';

  const aff = await prisma.affiliate.findFirst({
    where: { id: affiliateId, deletedAt: null, archivedAt: null },
    select: { id: true, name: true },
  });

  if (aff) {
    try {
      await prisma.click.create({
        data: {
          affiliateId: aff.id,
          ip: ip.slice(0, 255),
          userAgent: req.headers.get('user-agent') ?? '',
        },
      });
      checkFraudOnClick(aff.id, ip).catch(() => {});
      const alert = await checkClickAnomaly(aff.id, ip);
      if (alert) sendAlertEmail(aff.name ?? 'Unknown', alert.message).catch(() => {});
    } catch {
      // ignore click creation errors
    }
  }

  const response = NextResponse.redirect(REDIRECT_URL);
  if (aff) {
    const expires = new Date();
    expires.setDate(expires.getDate() + COOKIE_DAYS);
    response.cookies.set('ref', aff.id, {
      expires,
      sameSite: 'none',
      secure: true,
      path: '/',
      httpOnly: false,
    });
  }
  return response;
}
