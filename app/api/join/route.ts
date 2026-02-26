import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendAdminNewSignup } from '@/lib/email';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, referralCode: refCode } = body;
  if (!name || !email) {
    return NextResponse.json({ error: 'Name and email required' }, { status: 400 });
  }

  const existing = await prisma.affiliate.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: 'An affiliate with this email already exists' }, { status: 409 });
  }

  let parentId: string | null = null;
  const code = (refCode ?? '').toString().trim().toUpperCase();
  if (code) {
    const referrer = await prisma.affiliate.findFirst({
      where: { referralCode: code, status: 'active' },
    });
    if (referrer) parentId = referrer.id;
  }

  const affiliate = await prisma.affiliate.create({
    data: {
      name: (name as string).trim(),
      email: (email as string).trim().toLowerCase(),
      status: 'pending',
      parentId,
    },
  });

  try {
    await sendAdminNewSignup(affiliate.name, affiliate.email);
  } catch {
    // non-blocking
  }

  return NextResponse.json({
    ok: true,
    message: 'Application submitted. You will receive an email once approved.',
  });
}
