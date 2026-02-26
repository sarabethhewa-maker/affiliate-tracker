This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Admin dashboard

The root URL `/` is the admin dashboard (affiliates, conversions, settings). Only users whose email is listed as admin can access it.

- **First time / no admins yet:** Set `FIRST_ADMIN_EMAIL=your@email.com` in `.env.local` (use the same email as your Clerk login). You can then open the dashboard and add admin emails in **Settings → Admin emails**.
- **After that:** Use **Settings → Admin emails** (comma-separated) or **Admin notification email**. Only those addresses can open `/` and Settings.

## WooCommerce integration

Add these to `.env.local` (and optionally configure the same in Settings → WooCommerce):

- `WOOCOMMERCE_WEBHOOK_SECRET` — Secret from the WooCommerce webhook (Settings → Advanced → Webhooks). Used to verify Order updated webhooks.
- `WC_STORE_URL` — Store URL, e.g. `https://biolongevitylabs.com`
- `WC_CONSUMER_KEY` — WooCommerce REST API consumer key (ck_...)
- `WC_CONSUMER_SECRET` — WooCommerce REST API consumer secret (cs_...)

Create a webhook in WooCommerce for **Order updated** pointing to: `https://your-domain.com/api/webhooks/woocommerce`.

## Tipalti integration

Add to `.env.local`:

- `TIPALTI_API_KEY` — API key from Tipalti
- `TIPALTI_PAYER_NAME` — Payer name (e.g. `BiolongevityLabs`)
- `TIPALTI_SANDBOX=true` — Set to `false` in production

Configure Tipalti webhook for payment status to: `https://your-domain.com/api/webhooks/tipalti`.

## Email marketing (Klaviyo / Mailchimp)

Add to `.env.local` (or set in Settings → Email Marketing):

- `KLAVIYO_API_KEY` — Klaviyo private API key
- `KLAVIYO_AFFILIATE_LIST_ID` — List ID for synced affiliates
- `MAILCHIMP_API_KEY` — Mailchimp API key
- `MAILCHIMP_SERVER_PREFIX` — Server prefix (e.g. `us19`)
- `MAILCHIMP_AFFILIATE_LIST_ID` — List ID for synced affiliates

Active affiliates are synced when approved, when their tier changes, and when a payout is sent.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
