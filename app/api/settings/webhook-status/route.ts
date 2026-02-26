import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  const err = await requireAdmin();
  if (err) return err;
  const configured = !!(process.env.WOOCOMMERCE_WEBHOOK_SECRET ?? '').trim();
  return NextResponse.json({ configured });
}
