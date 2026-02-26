import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { currentUser } from '@clerk/nextjs/server';
import { requireAdmin, getCurrentUserEmail } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/settings';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress;
  const admin = await isAdmin(email ?? undefined);
  const now = new Date();

  if (admin) {
    const list = await prisma.announcement.findMany({
      orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
    });
    return NextResponse.json(list);
  }

  const list = await prisma.announcement.findMany({
    where: {
      publishedAt: { lte: now },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
  });
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const err = await requireAdmin();
  if (err) return err;

  const body = await req.json();
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  if (!title || !content) {
    return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
  }
  const priority = ['normal', 'important', 'urgent'].includes(body.priority) ? body.priority : 'normal';
  const pinned = !!body.pinned;
  const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
  const createdBy = (await getCurrentUserEmail()) || 'admin';

  const announcement = await prisma.announcement.create({
    data: { title, content, priority, pinned, expiresAt, createdBy },
  });
  return NextResponse.json(announcement);
}
