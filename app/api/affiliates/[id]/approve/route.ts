import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendAffiliateWelcome } from '@/lib/email';
import { logActivity } from '@/lib/activity';
import { getSettings } from '@/lib/settings';

function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;

  const id = (await params).id;
  const aff = await prisma.affiliate.findUnique({ where: { id } });
  if (!aff) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let referralCode = aff.referralCode;
  if (!referralCode) {
    let attempt = 0;
    while (attempt < 10) {
      referralCode = generateReferralCode();
      const exists = await prisma.affiliate.findUnique({ where: { referralCode } });
      if (!exists) break;
      attempt++;
    }
    if (!referralCode) return NextResponse.json({ error: 'Could not generate code' }, { status: 500 });
  }

  const updated = await prisma.affiliate.update({
    where: { id },
    data: { status: 'active', referralCode },
    include: { clicks: true, conversions: true, children: true, payouts: true },
  });

  const origin = req.headers.get('origin') || req.nextUrl.origin;
  const salesLink = `${origin}/api/ref/${updated.id}`;
  const recruitLink = `${origin}/join?ref=${updated.referralCode}`;
  try {
    await sendAffiliateWelcome(updated.name, updated.email, salesLink, recruitLink);
  } catch {
    // non-blocking
  }

  const settings = await getSettings();
  const tierIndex = parseInt(updated.tier, 10) || 0;
  const tierName = settings.tiers[tierIndex]?.name ?? 'Silver';
  await logActivity({
    type: 'affiliate_approved',
    message: `${updated.name} joined as a ${tierName} affiliate`,
    affiliateId: updated.id,
  });

  try {
    const { syncAffiliate } = await import('@/lib/emailMarketing');
    await syncAffiliate({ id: updated.id, name: updated.name, email: updated.email, tier: updated.tier });
  } catch {
    // non-blocking
  }

  return NextResponse.json(updated);
}
