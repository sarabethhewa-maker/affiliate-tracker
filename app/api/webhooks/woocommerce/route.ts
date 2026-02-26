import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { prisma } from '@/lib/prisma';
import { recalculateTiers } from '@/lib/settings';

const WEBHOOK_SECRET = process.env.WOOCOMMERCE_WEBHOOK_SECRET ?? '';

function verifySignature(rawBody: string, signature: string | null): boolean {
  if (!WEBHOOK_SECRET || !signature) return false;
  const expected = createHmac('sha256', WEBHOOK_SECRET).update(rawBody, 'utf8').digest('base64');
  return expected === signature;
}

function getAffiliateIdFromMetaData(metaData: unknown): string | null {
  if (!Array.isArray(metaData)) return null;
  for (const item of metaData) {
    const entry = item as { key?: string; value?: string };
    const key = (entry.key ?? '').toLowerCase();
    if (key === '_ref' || key === 'affiliate_id') {
      const v = entry.value;
      return typeof v === 'string' ? v : v != null ? String(v) : null;
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-wc-webhook-signature') ?? req.headers.get('X-WC-Webhook-Signature');
    if (!verifySignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const order = JSON.parse(rawBody) as {
      id?: number;
      total?: string | number;
      status?: string;
      meta_data?: unknown[];
    };

    const orderId = order.id != null ? String(order.id) : null;
    const status = (order.status ?? '').toLowerCase();
    const total = Number(order.total ?? 0) || 0;
    const affiliateId = getAffiliateIdFromMetaData(order.meta_data ?? []);

    if (!orderId) {
      return NextResponse.json({ ok: true, message: 'No order id' });
    }

    if (status === 'refunded') {
      const existing = await prisma.conversion.findUnique({
        where: { orderId },
      });
      if (existing) {
        await prisma.conversion.delete({ where: { id: existing.id } });
        await recalculateTiers();
      }
      return NextResponse.json({ ok: true, message: 'Refund handled' });
    }

    if (status !== 'completed' && status !== 'processing') {
      return NextResponse.json({ ok: true, message: 'Status ignored' });
    }

    if (!affiliateId) {
      return NextResponse.json({ ok: true, message: 'No affiliate ref' });
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { id: affiliateId },
    });
    if (!affiliate) {
      return NextResponse.json({ ok: true, message: 'Affiliate not found' });
    }

    const existing = await prisma.conversion.findUnique({
      where: { orderId },
    });
    if (existing) {
      return NextResponse.json({ ok: true, message: 'Conversion already exists' });
    }

    await prisma.conversion.create({
      data: {
        affiliateId,
        amount: total,
        orderId,
        source: 'woocommerce',
        status: 'pending',
      },
    });
    await recalculateTiers();

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
