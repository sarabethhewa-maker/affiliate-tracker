import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getSettings } from '@/lib/settings';

export async function POST(req: NextRequest) {
  const err = await requireAdmin();
  if (err) return err;

  let storeUrl: string;
  let consumerKey: string;
  let consumerSecret: string;

  const contentType = req.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const body = await req.json().catch(() => ({}));
    storeUrl = (body.wcStoreUrl ?? '').toString().trim().replace(/\/$/, '');
    consumerKey = (body.wcConsumerKey ?? '').toString().trim();
    consumerSecret = (body.wcConsumerSecret ?? '').toString().trim();
  } else {
    const settings = await getSettings();
    storeUrl = (process.env.WC_STORE_URL ?? settings.wcStoreUrl ?? '').replace(/\/$/, '');
    consumerKey = process.env.WC_CONSUMER_KEY ?? settings.wcConsumerKey ?? '';
    consumerSecret = process.env.WC_CONSUMER_SECRET ?? settings.wcConsumerSecret ?? '';
  }

  if (!storeUrl || !consumerKey || !consumerSecret) {
    return NextResponse.json(
      { ok: false, error: 'Store URL, Consumer Key, and Consumer Secret are required' },
      { status: 400 }
    );
  }

  const url = `${storeUrl}/wp-json/wc/v3/orders?per_page=1`;
  const authHeader = 'Basic ' + Buffer.from(consumerKey + ':' + consumerSecret).toString('base64');
  try {
    const res = await fetch(url, { headers: { Authorization: authHeader } });
    if (!res.ok) {
      return NextResponse.json({
        ok: false,
        error: `WooCommerce API returned ${res.status}: ${res.statusText}`,
      });
    }
    return NextResponse.json({ ok: true, message: 'Connection successful' });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: e instanceof Error ? e.message : 'Connection failed',
    });
  }
}
