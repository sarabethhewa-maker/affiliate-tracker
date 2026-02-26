import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateOnboardingLink } from '@/lib/tipalti';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;

  const id = (await params).id;
  const affiliate = await prisma.affiliate.findUnique({ where: { id } });
  if (!affiliate) return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });

  const idap = affiliate.tipaltiPayeeId ?? affiliate.id;
  const url = generateOnboardingLink(idap);
  return NextResponse.json({ url });
}
