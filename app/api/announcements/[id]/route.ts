import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;

  const id = (await params).id;
  const body = await req.json();
  const title = typeof body.title === 'string' ? body.title.trim() : undefined;
  const content = typeof body.content === 'string' ? body.content.trim() : undefined;
  const priority = ['normal', 'important', 'urgent'].includes(body.priority) ? body.priority : undefined;
  const pinned = typeof body.pinned === 'boolean' ? body.pinned : undefined;
  const expiresAt = body.expiresAt !== undefined ? (body.expiresAt ? new Date(body.expiresAt) : null) : undefined;

  const data: { title?: string; content?: string; priority?: string; pinned?: boolean; expiresAt?: Date | null } = {};
  if (title !== undefined) data.title = title;
  if (content !== undefined) data.content = content;
  if (priority !== undefined) data.priority = priority;
  if (pinned !== undefined) data.pinned = pinned;
  if (expiresAt !== undefined) data.expiresAt = expiresAt;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const announcement = await prisma.announcement.update({
    where: { id },
    data,
  });
  return NextResponse.json(announcement);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;

  const id = (await params).id;
  await prisma.announcement.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
