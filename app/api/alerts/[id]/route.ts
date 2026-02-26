import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;
  const id = (await params).id;
  const body = await _req.json().catch(() => ({}));
  if (body.dismissed === true) {
    await prisma.alert.update({
      where: { id },
      data: { dismissed: true },
    });
  }
  return NextResponse.json({ ok: true });
}
