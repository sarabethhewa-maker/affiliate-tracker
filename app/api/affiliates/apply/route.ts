import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendAdminNewSignup } from '@/lib/email';
import { generateUniqueSlug, slugFromName } from '@/lib/slug';

const MARKETING_CHANNELS = ['Social Media', 'Blog/Website', 'Email List', 'YouTube', 'TikTok', 'Podcast', 'Word of Mouth', 'Other'] as const;
const AUDIENCE_SIZES = ['Under 1,000', '1,000-10,000', '10,000-50,000', '50,000-100,000', '100,000+'] as const;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    name,
    email,
    phone,
    socialHandle,
    marketingChannel,
    audienceSize,
    howDidYouHear,
    whyJoin,
    websiteUrl,
    referralCode: refCode,
    agreeToTerms,
  } = body;

  if (!name || !email) {
    return NextResponse.json({ error: 'Full name and email are required' }, { status: 400 });
  }

  if (!agreeToTerms) {
    return NextResponse.json({ error: 'You must agree to the affiliate terms and conditions' }, { status: 400 });
  }

  const existing = await prisma.affiliate.findFirst({
    where: { email: String(email).trim().toLowerCase(), deletedAt: null },
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
        deletedAt: null,
        archivedAt: null,
        OR: [
          { referralCode: code.toUpperCase() },
          { id: code },
        ],
      },
    });
    if (referrer) parentId = referrer.id;
  }

  const marketingValue = marketingChannel && MARKETING_CHANNELS.includes(marketingChannel) ? marketingChannel : null;
  const audienceValue = audienceSize && AUDIENCE_SIZES.includes(audienceSize) ? audienceSize : null;
  const slug = await generateUniqueSlug(prisma, slugFromName(String(name).trim()));

  const affiliate = await prisma.affiliate.create({
    data: {
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      slug,
      status: 'pending',
      ...(parentId ? { parent: { connect: { id: parentId } } } : {}),
      phone: phone ? String(phone).trim() : null,
      socialHandle: socialHandle ? String(socialHandle).trim() : null,
      marketingChannel: marketingValue,
      audienceSize: audienceValue,
      howDidYouHear: howDidYouHear ? String(howDidYouHear).trim().slice(0, 500) : null,
      whyJoin: whyJoin ? String(whyJoin).trim().slice(0, 2000) : null,
      websiteUrl: websiteUrl ? String(websiteUrl).trim().slice(0, 500) : null,
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
