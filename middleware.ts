import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware((_auth, req) => {
  // Public: affiliate signup, apply API, portal (landing + gate), pretty ref links, webhooks (no Clerk)
  if (
    req.nextUrl.pathname === '/join' ||
    req.nextUrl.pathname === '/api/join' ||
    req.nextUrl.pathname === '/api/affiliates/apply' ||
    req.nextUrl.pathname === '/api/webhooks/woocommerce' ||
    req.nextUrl.pathname === '/api/webhooks/tipalti' ||
    req.nextUrl.pathname === '/portal' ||
    req.nextUrl.pathname.startsWith('/portal/') ||
    req.nextUrl.pathname === '/ref' ||
    req.nextUrl.pathname.startsWith('/ref/')
  )
    return;
  // Admin routes (/, /settings, etc.) and other API routes still go through Clerk.
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
