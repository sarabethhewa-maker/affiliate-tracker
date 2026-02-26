import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { testConnection } from '@/lib/emailMarketing';
import type { EmailMarketingPlatform } from '@/lib/settings';

export async function POST(req: NextRequest) {
  const err = await requireAdmin();
  if (err) return err;

  const body = await req.json().catch(() => ({}));
  const platform = (body.platform ?? 'none') as EmailMarketingPlatform;
  const error = await testConnection(platform);
  if (error) {
    return NextResponse.json({ ok: false, error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
