import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPayeeStatus } from '@/lib/tipalti';

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
  let status: 'pending' | 'active' | 'blocked';
  try {
    status = await getPayeeStatus(idap);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Tipalti status check failed' },
      { status: 400 }
    );
  }

  await prisma.affiliate.update({
    where: { id },
    data: { tipaltiStatus: status, tipaltiPayeeId: idap },
  });

  return NextResponse.json({ tipaltiStatus: status });
}
