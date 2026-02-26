import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { generateOnboardingLink } from '@/lib/tipalti';

/** Redirects the current user (affiliate) to Tipalti onboarding. Only allowed for the affiliate themselves. */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress;
  if (!email) return NextResponse.json({ error: 'No email' }, { status: 400 });

  const affiliate = await prisma.affiliate.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (!affiliate) return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });

  const idap = affiliate.tipaltiPayeeId ?? affiliate.id;
  const url = generateOnboardingLink(idap);
  return NextResponse.redirect(url);
}
