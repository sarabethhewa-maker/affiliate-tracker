import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { testConnection } from '@/lib/tipalti';

export async function POST() {
  const err = await requireAdmin();
  if (err) return err;

  const ok = await testConnection();
  return NextResponse.json({ ok, message: ok ? 'Connection successful' : 'Check API key and payer name' });
}
