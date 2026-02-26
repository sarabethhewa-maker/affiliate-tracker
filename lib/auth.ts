import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { isAdmin } from '@/lib/settings';

/** Use in API routes: if not authenticated or not admin, returns a NextResponse to return; otherwise returns null (proceed). */
export async function requireAdmin(): Promise<NextResponse | null> {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress;
  const ok = await isAdmin(email ?? undefined);
  if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return null;
}

/** Get current user email from Clerk (for use in API routes). Returns undefined if not signed in. */
export async function getCurrentUserEmail(): Promise<string | undefined> {
  const user = await currentUser();
  return user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress;
}
