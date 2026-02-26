import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendAffiliateWelcome } from '@/lib/email';

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
    const updated = await prisma.affiliate.update({
      where: { id },
      data: {
        status: 'active',
        referralCode,
        state: body.state ?? aff.state,
      },
      include: { clicks: true, conversions: true, children: true },
    });
    const origin = req.headers.get('origin') || req.nextUrl.origin;
    const salesLink = `${origin}/api/ref/${updated.id}`;
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
