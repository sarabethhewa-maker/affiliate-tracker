import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendAdminNewSignup } from '@/lib/email';

const HOW_DID_YOU_HEAR = ['Social Media', 'Friend/Referral', 'Google', 'Other'] as const;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    name,
    email,
    phone,
    socialHandle,
    howDidYouHear,
    referralCode: refCode,
    agreeToTerms,
  } = body;

  if (!name || !email) {
    return NextResponse.json({ error: 'Full name and email are required' }, { status: 400 });
  }

  if (!agreeToTerms) {
    return NextResponse.json({ error: 'You must agree to the affiliate terms and conditions' }, { status: 400 });
  }

  const existing = await prisma.affiliate.findUnique({
    where: { email: String(email).trim().toLowerCase() },
  });
  if (existing) {
    return NextResponse.json({ error: 'An affiliate with this email already exists' }, { status: 409 });
  }

  let parentId: string | null = null;
  const code = refCode ? String(refCode).trim() : '';
  if (code) {
    const referrer = await prisma.affiliate.findFirst({
      where: {
        status: 'active',
        OR: [
          { referralCode: code.toUpperCase() },
          { id: code },
        ],
      },
    });
    if (referrer) parentId = referrer.id;
  }

  const howValue = howDidYouHear && HOW_DID_YOU_HEAR.includes(howDidYouHear) ? howDidYouHear : null;

  const affiliate = await prisma.affiliate.create({
    data: {
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      status: 'pending',
      parentId,
      phone: phone ? String(phone).trim() : null,
      socialHandle: socialHandle ? String(socialHandle).trim() : null,
      howDidYouHear: howValue,
    },
  });

  try {
    await sendAdminNewSignup(affiliate.name, affiliate.email);
  } catch {
    // non-blocking
  }

  return NextResponse.json({
    ok: true,
    message: "Thanks! We'll review your application and be in touch within 48 hours.",
  });
}
