import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateUniqueSlug, slugFromName } from '@/lib/slug';
import { getSettings, getTierIndexForRevenue } from '@/lib/settings';

type ImportAffiliate = {
  name: string;
  email?: string;
  tier?: string;
  phone?: string;
  socialHandle?: string;
  websiteUrl?: string;
  couponCode?: string;
  totalConversions?: number;
  totalRevenue?: number;
  totalPayout?: number;
  commissionRate?: number;
  referred_by_email?: string;
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

function ensureEmail(row: ImportAffiliate, index: number): string {
  const email = String(row?.email ?? '').trim().toLowerCase();
  if (email) return email;
  const base = row?.name?.trim().toLowerCase().replace(/[^a-z0-9]/g, '') || 'affiliate';
  return `import-${base.slice(0, 12)}-${index}-${Date.now().toString(36)}@imported.placeholder`;
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
    const skippedReasons: { row: number; reason: string }[] = [];
    let totalHistoricalRevenue = 0;
    let totalHistoricalPayouts = 0;
    const tierBreakdown: Record<string, number> = { silver: 0, gold: 0, master: 0 };

    const settings = await getSettings();
    const tierNames = settings.tiers.map((t) => t.name.toLowerCase());

    for (let i = 0; i < affiliates.length; i++) {
      const row = affiliates[i] as ImportAffiliate;
      const name = String(row?.name ?? '').trim();
      if (!name) {
        skipped++;
        skippedReasons.push({ row: i + 1, reason: 'Empty name' });
        continue;
      }

      const email = ensureEmail(row, i);
      const existing = await prisma.affiliate.findUnique({
        where: { email },
      });

      if (existing) {
        if (!updateExisting) {
          skipped++;
          skippedReasons.push({ row: i + 1, reason: 'Duplicate email' });
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
            tier: row.tier != null ? normalizeTier(row.tier) : existing.tier,
            phone: row.phone != null ? String(row.phone).trim() || null : existing.phone,
            socialHandle: row.socialHandle != null ? String(row.socialHandle).trim() || null : existing.socialHandle,
            websiteUrl: row.websiteUrl != null ? String(row.websiteUrl).trim().slice(0, 500) || null : existing.websiteUrl,
            couponCode: row.couponCode != null ? String(row.couponCode).trim() || null : existing.couponCode,
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

      const totalRevenue = typeof row.totalRevenue === 'number' ? row.totalRevenue : Number(row.totalRevenue) || 0;
      const tierIndex =
        totalRevenue > 0
          ? getTierIndexForRevenue(totalRevenue, settings.tiers)
          : parseInt(normalizeTier(row.tier), 10) ?? 0;

      try {
        const slug = await generateUniqueSlug(prisma, slugFromName(name));
        const aff = await prisma.affiliate.create({
          data: {
            name: name || email,
            email,
            slug,
            tier: String(tierIndex),
            status,
            phone: row.phone ? String(row.phone).trim().slice(0, 50) : null,
            socialHandle: row.socialHandle ? String(row.socialHandle).trim().slice(0, 100) : null,
            websiteUrl: row.websiteUrl ? String(row.websiteUrl).trim().slice(0, 500) : null,
            couponCode: row.couponCode ? String(row.couponCode).trim().slice(0, 50) : null,
            notes: row.notes ? String(row.notes).trim().slice(0, 2000) : null,
            parentId,
            historicalConversions: typeof row.totalConversions === 'number' ? row.totalConversions : Number(row.totalConversions) || null,
            historicalRevenue: totalRevenue > 0 ? totalRevenue : null,
            importSource: 'csv-import',
          },
        });

        if (totalRevenue > 0) {
          totalHistoricalRevenue += totalRevenue;
          await prisma.conversion.create({
            data: {
              affiliateId: aff.id,
              amount: totalRevenue,
              status: 'approved',
              orderNumber: 'HISTORICAL-IMPORT',
              orderStatus: 'completed',
              source: 'historical-import',
            },
          });
        }

        const totalPayout = typeof row.totalPayout === 'number' ? row.totalPayout : Number(row.totalPayout) || 0;
        if (totalPayout > 0) {
          totalHistoricalPayouts += totalPayout;
          await prisma.payout.create({
            data: {
              affiliateId: aff.id,
              amount: totalPayout,
              method: 'other',
              note: 'Historical import',
              payoutStatus: 'confirmed',
            },
          });
        }

        const tierKey = tierNames[tierIndex] ?? 'silver';
        if (tierKey === 'silver') tierBreakdown.silver++;
        else if (tierKey === 'gold') tierBreakdown.gold++;
        else tierBreakdown.master++;

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
        details:
          errors.length || skippedReasons.length
            ? ({ errors, skippedReasons, tierBreakdown, totalHistoricalRevenue, totalHistoricalPayouts } as unknown as object)
            : undefined,
      },
    });

    return NextResponse.json({
      imported,
      updated,
      skipped,
      errors: errors.length,
      errorDetails: errors,
      total: affiliates.length,
      summary: {
        tierBreakdown: {
          silver: tierBreakdown.silver,
          gold: tierBreakdown.gold,
          master: tierBreakdown.master,
        },
        totalHistoricalRevenue: Math.round(totalHistoricalRevenue * 100) / 100,
        totalHistoricalPayouts: Math.round(totalHistoricalPayouts * 100) / 100,
        skippedReasons,
      },
    });
  } catch (e) {
    console.error('[api/affiliates/import]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    );
  }
}
