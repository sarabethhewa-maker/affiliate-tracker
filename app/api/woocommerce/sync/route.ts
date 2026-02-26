import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { recalculateTiers, getSettings } from '@/lib/settings';

type WCOrder = {
  id: number;
  total: string;
  status: string;
  meta_data?: { id?: number; key?: string; value?: string }[];
};

function getAffiliateIdFromMetaData(metaData: WCOrder['meta_data']): string | null {
  if (!Array.isArray(metaData)) return null;
  for (const item of metaData) {
    const key = (item.key ?? '').toLowerCase();
    if (key === '_ref' || key === 'affiliate_id') {
      const v = item.value;
      return typeof v === 'string' ? v : v != null ? String(v) : null;
    }
  }
  return null;
}

export async function POST() {
  const err = await requireAdmin();
  if (err) return err;

  const settings = await getSettings();
  const storeUrl = (process.env.WC_STORE_URL ?? (settings as { wcStoreUrl?: string }).wcStoreUrl ?? '').replace(/\/$/, '');
  const consumerKey = process.env.WC_CONSUMER_KEY ?? (settings as { wcConsumerKey?: string }).wcConsumerKey ?? '';
  const consumerSecret = process.env.WC_CONSUMER_SECRET ?? (settings as { wcConsumerSecret?: string }).wcConsumerSecret ?? '';

  if (!storeUrl || !consumerKey || !consumerSecret) {
    return NextResponse.json(
      { error: 'Set WC_STORE_URL, WC_CONSUMER_KEY, WC_CONSUMER_SECRET in .env.local or in Settings → WooCommerce' },
      { status: 400 }
    );
  }

  const url = `${storeUrl}/wp-json/wc/v3/orders?status=completed&per_page=100`;

  const authHeader = 'Basic ' + Buffer.from(consumerKey + ':' + consumerSecret).toString('base64');
  const res = await fetch(url, {
    headers: { Authorization: authHeader },
  });
  if (!res.ok) {
    return NextResponse.json({ error: 'WooCommerce API error: ' + res.statusText }, { status: 502 });
  }

  const orders = (await res.json()) as WCOrder[];
  let created = 0;
  for (const order of orders) {
    const orderId = String(order.id);
    const existing = await prisma.conversion.findUnique({ where: { orderId } });
    if (existing) continue;

    const affiliateId = getAffiliateIdFromMetaData(order.meta_data);
    if (!affiliateId) continue;

    const affiliate = await prisma.affiliate.findFirst({
      where: { id: affiliateId, deletedAt: null, archivedAt: null },
    });
    if (!affiliate) continue;

    const amount = Number(order.total) || 0;
    if (amount <= 0) continue;

    await prisma.conversion.create({
      data: {
        affiliateId,
        amount,
        orderId,
        source: 'woocommerce',
        status: 'pending',
      },
    });
    created++;
  }

  if (created > 0) await recalculateTiers();

  return NextResponse.json({ ok: true, created });
}
