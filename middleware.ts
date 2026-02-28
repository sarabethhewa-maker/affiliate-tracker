import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export default clerkMiddleware((_auth, req) => {
  const pathname = req.nextUrl.pathname;
  // Redirects
  if (pathname === '/admin') return NextResponse.redirect(new URL('/dashboard', req.url));
  if (pathname === '/settings') return NextResponse.redirect(new URL('/dashboard/settings', req.url));
  if (pathname === '/how-to-use') return NextResponse.redirect(new URL('/dashboard/how-to-use', req.url));
  if (pathname === '/register') return NextResponse.redirect(new URL('/join', req.url));
  if (pathname === '/login') return NextResponse.redirect(new URL('/portal', req.url));
  // Public: landing page, affiliate signup, apply API, portal, pretty ref links, webhooks (no Clerk)
  if (
    pathname === '/' ||
    pathname === '/join' ||
    pathname === '/api/join' ||
    pathname === '/api/affiliates/apply' ||
    pathname === '/api/webhooks/woocommerce' ||
    pathname === '/api/webhooks/tipalti' ||
    pathname === '/portal' ||
    pathname.startsWith('/portal/') ||
    pathname === '/ref' ||
    pathname.startsWith('/ref/')
  )
    return;
  // Admin routes (/dashboard, etc.) and other API routes go through Clerk.
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
