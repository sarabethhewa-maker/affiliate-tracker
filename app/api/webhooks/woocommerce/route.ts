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

function getAffiliateRefFromMetaData(metaData: unknown): string | null {
  if (!Array.isArray(metaData)) return null;
  const keys = ['_bll_affiliate_ref', '_ref', 'affiliate_id'];
  for (const item of metaData) {
    const entry = item as { key?: string; value?: string };
    const key = (entry.key ?? '').toLowerCase();
    if (keys.some((k) => key === k)) {
      const v = entry.value;
      return typeof v === 'string' ? v.trim() : v != null ? String(v).trim() : null;
    }
  }
  return null;
}

function getOrderCouponCodes(order: { coupon_lines?: unknown[] }): string[] {
  if (!Array.isArray(order.coupon_lines)) return [];
  return order.coupon_lines
    .map((c: unknown) => {
      const o = c as { code?: string };
      return typeof o.code === 'string' ? o.code.trim().toUpperCase() : '';
    })
    .filter(Boolean);
}

type OrderPayload = {
  id?: number;
  number?: string | number;
  total?: string | number;
  status?: string;
  meta_data?: unknown[];
  line_items?: unknown[];
  billing?: Record<string, unknown>;
  coupon_lines?: unknown[];
};

function parseOrderDetails(order: OrderPayload): {
  orderNumber: string | null;
  orderStatus: string | null;
  orderItems: { name: string; quantity: number; total: string }[];
  customerName: string | null;
  customerCity: string | null;
} {
  const orderNumber =
    order.number != null ? String(order.number) : order.id != null ? String(order.id) : null;
  const orderStatus = order.status ? String(order.status).toLowerCase() : null;
  const orderItems: { name: string; quantity: number; total: string }[] = [];
  if (Array.isArray(order.line_items)) {
    for (const item of order.line_items) {
      const row = item as { name?: string; quantity?: number; total?: string };
      orderItems.push({
        name: typeof row.name === 'string' ? row.name : 'Product',
        quantity: typeof row.quantity === 'number' ? row.quantity : Number(row.quantity) || 1,
        total: typeof row.total === 'string' ? row.total : String(row.total ?? '0'),
      });
    }
  }
  const billing = order.billing && typeof order.billing === 'object' ? order.billing : {};
  const customerName =
    typeof billing.first_name === 'string' ? billing.first_name.trim() : null;
  const customerCity =
    typeof billing.city === 'string' ? billing.city.trim() : null;
  return { orderNumber, orderStatus, orderItems, customerName, customerCity };
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-wc-webhook-signature') ?? req.headers.get('X-WC-Webhook-Signature');
    if (!verifySignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const order = JSON.parse(rawBody) as OrderPayload;

    const orderId = order.id != null ? String(order.id) : null;
    const status = (order.status ?? '').toLowerCase();
    const total = Number(order.total ?? 0) || 0;
    const affiliateRef = getAffiliateRefFromMetaData(order.meta_data ?? []);
    const couponCodes = getOrderCouponCodes(order);
    const details = parseOrderDetails(order);

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

    // On order status change: update existing conversion's orderStatus (and optionally mark confirmed when completed)
    const existingConversion = await prisma.conversion.findUnique({
      where: { orderId },
    });
    if (existingConversion) {
      const orderItemsUpdate = details.orderItems.length > 0
        ? (details.orderItems as unknown as object)
        : (existingConversion.orderItems != null ? existingConversion.orderItems as object : undefined);
      await prisma.conversion.update({
        where: { orderId },
        data: {
          orderNumber: details.orderNumber ?? existingConversion.orderNumber,
          orderStatus: details.orderStatus ?? status,
          ...(orderItemsUpdate !== undefined && { orderItems: orderItemsUpdate }),
          customerName: details.customerName ?? existingConversion.customerName,
          customerCity: details.customerCity ?? existingConversion.customerCity,
          amount: total,
          ...(status === 'completed' ? { status: 'approved' as const } : {}),
        },
      });
      return NextResponse.json({ ok: true, message: 'Order status updated' });
    }

    if (status !== 'completed' && status !== 'processing') {
      return NextResponse.json({ ok: true, message: 'Status ignored' });
    }

    const activeWhere = { deletedAt: null, archivedAt: null };
    let affiliate =
      affiliateRef != null && affiliateRef !== ''
        ? (await prisma.affiliate.findFirst({ where: { id: affiliateRef, ...activeWhere } })) ??
          (await prisma.affiliate.findFirst({ where: { slug: affiliateRef, ...activeWhere } }))
        : null;

    if (!affiliate && couponCodes.length > 0) {
      for (const code of couponCodes) {
        const byCoupon = await prisma.affiliate.findFirst({
          where: { couponCode: { equals: code, mode: 'insensitive' }, ...activeWhere },
        });
        if (byCoupon) {
          affiliate = byCoupon;
          break;
        }
      }
    }

    if (!affiliate) {
      return NextResponse.json({ ok: true, message: 'No affiliate ref or coupon match' });
    }

    const conversionData = {
      orderNumber: details.orderNumber,
      orderStatus: details.orderStatus ?? status,
      orderItems: details.orderItems.length > 0 ? (details.orderItems as unknown as object) : undefined,
      customerName: details.customerName ?? undefined,
      customerCity: details.customerCity ?? undefined,
    };

    await prisma.conversion.create({
      data: {
        affiliateId: affiliate.id,
        amount: total,
        orderId,
        source: 'woocommerce',
        status: status === 'completed' ? 'approved' : 'pending',
        orderNumber: conversionData.orderNumber ?? undefined,
        orderStatus: conversionData.orderStatus ?? status,
        orderItems: conversionData.orderItems ?? undefined,
        customerName: conversionData.customerName ?? undefined,
        customerCity: conversionData.customerCity ?? undefined,
      },
    });
    await recalculateTiers();

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
