import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendAffiliateRejection } from '@/lib/email';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;

  const id = (await params).id;
  const aff = await prisma.affiliate.findUnique({ where: { id } });
  if (!aff) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let sendEmail = false;
  try {
    const body = await req.json();
    sendEmail = !!body.sendEmail;
  } catch {
    // no body
  }

  await prisma.affiliate.update({
    where: { id },
    data: { status: 'rejected' },
  });

  if (sendEmail) {
    try {
      await sendAffiliateRejection(aff.name, aff.email);
    } catch {
      // non-blocking
    }
  }

  return NextResponse.json({ ok: true });
}
