import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, getCurrentUserEmail } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;

  const id = (await params).id;
  const body = await req.json();
  const note = typeof body.note === 'string' ? body.note.trim() : '';

  const flag = await prisma.fraudFlag.findUnique({ where: { id } });
  if (!flag) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const resolvedBy = await getCurrentUserEmail();

  const updated = await prisma.fraudFlag.update({
    where: { id },
    data: {
      resolved: true,
      resolvedBy: resolvedBy ?? undefined,
      resolvedAt: new Date(),
      resolvedNote: note || undefined,
    },
    include: { affiliate: { select: { id: true, name: true } } },
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
  await prisma.fraudFlag.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
