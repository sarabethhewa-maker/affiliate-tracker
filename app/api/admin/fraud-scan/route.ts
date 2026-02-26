import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { runFraudScan } from '@/lib/fraud';

export async function POST() {
  const err = await requireAdmin();
  if (err) return err;

  const result = await runFraudScan();
  return NextResponse.json({ ok: true, flagged: result.flagged });
}
