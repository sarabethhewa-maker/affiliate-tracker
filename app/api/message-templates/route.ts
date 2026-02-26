import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/settings';
import { seedMessageTemplatesIfEmpty } from '@/lib/seed-templates';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await seedMessageTemplatesIfEmpty();

    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress;
    const admin = await isAdmin(email ?? undefined);

    const list = await prisma.messageTemplate.findMany({
      where: admin ? undefined : { active: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return NextResponse.json(list);
  } catch (e) {
    console.error('[api/message-templates] GET', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const err = await requireAdmin();
  if (err) return err;

  try {
    const body = await req.json();
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const category = typeof body.category === 'string' ? body.category.trim() : 'other';
    const bodyText = typeof body.body === 'string' ? body.body.trim() : '';
    if (!title || !bodyText) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
    }
    const subject = body.subject != null ? String(body.subject).trim() || null : null;
    const sortOrder = typeof body.sortOrder === 'number' ? body.sortOrder : 0;
    const active = body.active !== false;

    const template = await prisma.messageTemplate.create({
      data: { title, category, subject, body: bodyText, sortOrder, active },
    });
    return NextResponse.json(template);
  } catch (e) {
    console.error('[api/message-templates] POST', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    );
  }
}
