import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { syncAllAffiliates } from '@/lib/emailMarketing';

export async function POST() {
  const err = await requireAdmin();
  if (err) return err;

  try {
    const result = await syncAllAffiliates();
    if (result.error) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, synced: result.synced });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Sync failed' },
      { status: 500 }
    );
  }
}
