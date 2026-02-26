import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendAffiliateWelcome } from '@/lib/email';
import { isValidSlug, sanitizeSlug } from '@/lib/slug';

const AFFILIATE_INCLUDE = {
  clicks: true,
  conversions: true,
  children: true,
  payouts: true,
  slugHistory: true,
} as const;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;

  const id = (await params).id;
  const affiliate = await prisma.affiliate.findUnique({
    where: { id, deletedAt: null },
    include: AFFILIATE_INCLUDE,
  });
  if (!affiliate) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(affiliate);
}

function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;

  const id = (await params).id;
  const body = await req.json();

  if (body.status === 'active' || body.approve) {
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
    let updated = await prisma.affiliate.update({
      where: { id },
      data: {
        status: 'active',
        referralCode,
        state: body.state ?? aff.state,
      },
      include: AFFILIATE_INCLUDE,
    });
    const origin = req.headers.get('origin') || req.nextUrl.origin;
    const salesLink = updated.slug ? `${origin}/ref/${updated.slug}` : `${origin}/api/ref/${updated.id}`;
    const recruitLink = `${origin}/join?ref=${updated.referralCode}`;
    try {
      await sendAffiliateWelcome(updated.name, updated.email, salesLink, recruitLink);
    } catch {
      // non-blocking
    }
    return NextResponse.json(updated);
  }

  if (body.status === 'rejected') {
    const updated = await prisma.affiliate.update({
      where: { id },
      data: { status: 'rejected' },
      include: AFFILIATE_INCLUDE,
    });
    return NextResponse.json(updated);
  }

  // coupon code update
  if (body.couponCode !== undefined) {
    const code = typeof body.couponCode === 'string' ? body.couponCode.trim() || null : null;
    const updated = await prisma.affiliate.update({
      where: { id },
      data: { couponCode: code },
      include: AFFILIATE_INCLUDE,
    });
    return NextResponse.json(updated);
  }

  // add store credit
  if (typeof body.storeCreditAdd === 'number' && body.storeCreditAdd > 0) {
    const aff = await prisma.affiliate.findUnique({ where: { id }, select: { storeCredit: true } });
    if (!aff) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = await prisma.affiliate.update({
      where: { id },
      data: { storeCredit: aff.storeCredit + body.storeCreditAdd },
      include: AFFILIATE_INCLUDE,
    });
    return NextResponse.json(updated);
  }

  // contact & social fields
  const contactData: {
    email?: string;
    phone?: string | null;
    mailingAddress?: string | null;
    instagramUrl?: string | null;
    tiktokUrl?: string | null;
    youtubeUrl?: string | null;
    websiteUrl?: string | null;
    state?: string;
    notes?: string;
  } = {};
  if (body.email !== undefined) {
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    if (email) {
      const existing = await prisma.affiliate.findFirst({ where: { email, NOT: { id } } });
      if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
      contactData.email = email;
    }
  }
  if (body.phone !== undefined) contactData.phone = typeof body.phone === 'string' ? body.phone.trim() || null : null;
  if (body.mailingAddress !== undefined) contactData.mailingAddress = typeof body.mailingAddress === 'string' ? body.mailingAddress.trim() || null : null;
  if (body.instagramUrl !== undefined) contactData.instagramUrl = typeof body.instagramUrl === 'string' ? body.instagramUrl.trim() || null : null;
  if (body.tiktokUrl !== undefined) contactData.tiktokUrl = typeof body.tiktokUrl === 'string' ? body.tiktokUrl.trim() || null : null;
  if (body.youtubeUrl !== undefined) contactData.youtubeUrl = typeof body.youtubeUrl === 'string' ? body.youtubeUrl.trim() || null : null;
  if (body.websiteUrl !== undefined) contactData.websiteUrl = typeof body.websiteUrl === 'string' ? body.websiteUrl.trim() || null : null;
  if (body.state !== undefined) contactData.state = body.state;
  if (body.notes !== undefined) contactData.notes = body.notes;

  if (Object.keys(contactData).length > 0) {
    const updated = await prisma.affiliate.update({
      where: { id },
      data: contactData,
      include: AFFILIATE_INCLUDE,
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;

  const id = (await params).id;
  const aff = await prisma.affiliate.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
  if (!aff) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    await tx.alert.deleteMany({ where: { affiliateId: id } });
    await tx.activityLog.updateMany({ where: { affiliateId: id }, data: { affiliateId: null } });
    await tx.affiliate.delete({ where: { id } });
  });

  return NextResponse.json({ ok: true, deleted: aff.name });
}
