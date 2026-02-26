import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendAffiliateWelcome } from '@/lib/email';
import { isValidSlug, sanitizeSlug } from '@/lib/slug';

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
      include: { clicks: true, conversions: true, children: true },
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
      include: { clicks: true, conversions: true, children: true },
    });
    return NextResponse.json(updated);
  }

  // slug update (admin)
  if (body.slug !== undefined) {
    const slug = sanitizeSlug(String(body.slug));
    if (!isValidSlug(slug)) {
      return NextResponse.json(
        { error: 'Slug must be 3–30 characters, lowercase letters, numbers, and hyphens only' },
        { status: 400 }
      );
    }
    const taken = await prisma.affiliate.findFirst({
      where: { slug, NOT: { id } },
    });
    if (taken) {
      return NextResponse.json({ error: 'This link name is already taken' }, { status: 409 });
    }
    const updated = await prisma.affiliate.update({
      where: { id },
      data: { slug },
      include: { clicks: true, conversions: true, children: true, payouts: true },
    });
    return NextResponse.json(updated);
  }

  // coupon code update
  if (body.couponCode !== undefined) {
    const code = typeof body.couponCode === 'string' ? body.couponCode.trim() || null : null;
    const updated = await prisma.affiliate.update({
      where: { id },
      data: { couponCode: code },
      include: { clicks: true, conversions: true, children: true, payouts: true },
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
      include: { clicks: true, conversions: true, children: true, payouts: true },
    });
    return NextResponse.json(updated);
  }

  // generic update (state, notes, etc.)
  const data: { state?: string; notes?: string } = {};
  if (body.state !== undefined) data.state = body.state;
  if (body.notes !== undefined) data.notes = body.notes;
  const updated = await prisma.affiliate.update({
    where: { id },
    data,
    include: { clicks: true, conversions: true, children: true },
  });
  return NextResponse.json(updated);
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
