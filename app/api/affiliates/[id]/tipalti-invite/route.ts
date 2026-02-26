import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createPayee } from '@/lib/tipalti';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;

  const id = (await params).id;
  const affiliate = await prisma.affiliate.findUnique({ where: { id } });
  if (!affiliate) return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });

  try {
    await createPayee(
      { id: affiliate.id, name: affiliate.name, email: affiliate.email },
      true
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Tipalti invite failed' },
      { status: 400 }
    );
  }

  await prisma.affiliate.update({
    where: { id },
    data: {
      tipaltiPayeeId: affiliate.id,
      tipaltiStatus: 'pending',
    },
  });

  return NextResponse.json({ ok: true, tipaltiPayeeId: affiliate.id });
}
