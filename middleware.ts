import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware((_auth, req) => {
  // Public: affiliate signup, apply API, and webhooks (no Clerk)
  if (
    req.nextUrl.pathname === '/join' ||
    req.nextUrl.pathname === '/api/join' ||
    req.nextUrl.pathname === '/api/affiliates/apply' ||
    req.nextUrl.pathname === '/api/webhooks/woocommerce' ||
    req.nextUrl.pathname === '/api/webhooks/tipalti'
  )
    return;
  // /portal and sub-routes require any signed-in user (enforced by Clerk); admin routes (/, /settings, etc.) require admin (checked in (admin)/layout).
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
