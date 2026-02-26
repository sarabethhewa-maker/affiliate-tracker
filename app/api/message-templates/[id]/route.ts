import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  try {
    const body = await req.json();
    const data: { title?: string; category?: string; subject?: string | null; body?: string; sortOrder?: number; active?: boolean } = {};
    if (typeof body.title === 'string') data.title = body.title.trim();
    if (typeof body.category === 'string') data.category = body.category.trim();
    if ('subject' in body) data.subject = body.subject != null ? String(body.subject).trim() || null : null;
    if (typeof body.body === 'string') data.body = body.body.trim();
    if (typeof body.sortOrder === 'number') data.sortOrder = body.sortOrder;
    if (typeof body.active === 'boolean') data.active = body.active;

    const template = await prisma.messageTemplate.update({
      where: { id },
      data,
    });
    return NextResponse.json(template);
  } catch (e) {
    console.error('[api/message-templates] PATCH', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Not found' },
      { status: e instanceof Error && e.message.includes('Record') ? 404 : 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requireAdmin();
  if (err) return err;

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  try {
    await prisma.messageTemplate.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[api/message-templates] DELETE', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Not found' },
      { status: 404 }
    );
  }
}
