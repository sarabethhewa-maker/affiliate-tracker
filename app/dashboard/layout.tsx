import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import { isAdmin } from '@/lib/settings';
import ChatWidget from '@/app/components/ChatWidget';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress;
  const ok = await isAdmin(email ?? undefined);
  if (!ok) redirect('/portal');
  return (
    <>
      {children}
      <ChatWidget context="admin" />
    </>
  );
}
