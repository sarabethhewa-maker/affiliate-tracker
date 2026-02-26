import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type ImportAffiliate = {
  name: string;
  email: string;
  tier?: string;
  phone?: string;
  socialHandle?: string;
  referred_by_email?: string;
  monthly_sales_override?: number;
  notes?: string;
};

const TIER_MAP: Record<string, string> = {
  master: '2',
  gold: '1',
  silver: '0',
  bronze: '0',
};

function normalizeTier(tier: string | undefined): string {
  if (!tier) return '0';
  const t = tier.trim().toLowerCase();
  return TIER_MAP[t] ?? (t === '2' || t === '1' ? t : '0');
}

export async function POST(req: NextRequest) {
  const err = await requireAdmin();
  if (err) return err;

  try {
    const body = await req.json();
    const {
      affiliates,
      skipDuplicates = true,
      updateExisting = false,
      defaultStatus = 'active',
    } = body as {
      affiliates: ImportAffiliate[];
      skipDuplicates?: boolean;
      updateExisting?: boolean;
      defaultStatus?: 'active' | 'pending';
    };

    if (!Array.isArray(affiliates) || affiliates.length === 0) {
      return NextResponse.json(
        { error: 'affiliates array is required and must not be empty' },
        { status: 400 }
      );
    }

    const status = defaultStatus === 'pending' ? 'pending' : 'active';
    let imported = 0;
    let updated = 0;
    let skipped = 0;
    const errors: { row: number; email: string; message: string }[] = [];

    for (let i = 0; i < affiliates.length; i++) {
      const row = affiliates[i] as ImportAffiliate;
      const email = String(row?.email ?? '').trim().toLowerCase();
      const name = String(row?.name ?? '').trim();

      if (!email) {
        skipped++;
        if (skipDuplicates) continue;
        errors.push({ row: i + 1, email: row?.email ?? '', message: 'Missing email' });
        continue;
      }

      const existing = await prisma.affiliate.findUnique({
        where: { email },
      });

      if (existing) {
        if (!updateExisting) {
          skipped++;
          continue;
        }
        let parentId: string | null = null;
        if (row.referred_by_email) {
          const referrer = await prisma.affiliate.findUnique({
            where: { email: String(row.referred_by_email).trim().toLowerCase() },
          });
          if (referrer) parentId = referrer.id;
        }
        await prisma.affiliate.update({
          where: { id: existing.id },
          data: {
            name: name || existing.name,
            tier: normalizeTier(row.tier) ?? existing.tier,
            phone: row.phone != null ? String(row.phone).trim() || null : existing.phone,
            socialHandle: row.socialHandle != null ? String(row.socialHandle).trim() || null : existing.socialHandle,
            notes: row.notes != null ? String(row.notes).trim() || null : existing.notes,
            parentId: parentId ?? existing.parentId,
          },
        });
        updated++;
        continue;
      }

      let parentId: string | null = null;
      if (row.referred_by_email) {
        const referrer = await prisma.affiliate.findUnique({
          where: { email: String(row.referred_by_email).trim().toLowerCase() },
        });
        if (referrer) parentId = referrer.id;
      }

      try {
        await prisma.affiliate.create({
          data: {
            name: name || email,
            email,
            tier: normalizeTier(row.tier),
            status,
            phone: row.phone ? String(row.phone).trim() : null,
            socialHandle: row.socialHandle ? String(row.socialHandle).trim() : null,
            notes: row.notes ? String(row.notes).trim() : null,
            parentId,
          },
        });
        imported++;
      } catch (e) {
        errors.push({
          row: i + 1,
          email,
          message: e instanceof Error ? e.message : 'Create failed',
        });
      }
    }

    const method = (body.method as string) || 'csv';
    await prisma.importLog.create({
      data: {
        method,
        totalCount: affiliates.length,
        importedCount: imported,
        skippedCount: skipped,
        errorCount: errors.length,
        details: errors.length ? (errors as unknown as object) : undefined,
      },
    });

    return NextResponse.json({
      imported,
      updated,
      skipped,
      errors: errors.length,
      errorDetails: errors,
      total: affiliates.length,
    });
  } catch (e) {
    console.error('[api/affiliates/import]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    );
  }
}
