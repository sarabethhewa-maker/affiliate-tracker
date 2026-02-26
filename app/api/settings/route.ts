import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getSettings,
  saveSettings,
  getTierIndexForRevenue,
  type AppSettings,
  type TierRow,
  DEFAULT_TIERS,
  DEFAULT_PROGRAM_NAME,
  DEFAULT_WEBSITE_URL,
  DEFAULT_COOKIE_DAYS,
} from '@/lib/settings';

function parseTiers(body: unknown): TierRow[] {
  if (!Array.isArray(body)) return [...DEFAULT_TIERS];
  return body.map((row: unknown) => {
    const r = row as Record<string, unknown>;
    return {
      name: typeof r.name === 'string' ? r.name : 'Tier',
      commission: typeof r.commission === 'number' ? r.commission : Number(r.commission) || 10,
      mlm2: typeof r.mlm2 === 'number' ? r.mlm2 : Number(r.mlm2) || 3,
      mlm3: typeof r.mlm3 === 'number' ? r.mlm3 : Number(r.mlm3) || 1,
      threshold: typeof r.threshold === 'number' ? r.threshold : Number(r.threshold) || 0,
    };
  });
}

export async function GET() {
  const err = await requireAdmin();
  if (err) return err;
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest) {
  const err = await requireAdmin();
  if (err) return err;

  const body = await req.json();

  const tiers = parseTiers(body.tiers);
  if (tiers.length < 1 || tiers.length > 5) {
    return NextResponse.json({ error: 'Tiers must be between 1 and 5' }, { status: 400 });
  }

  const current = await getSettings();
  const platform = body.emailMarketingPlatform;
  const emailMarketingPlatform =
    platform === 'klaviyo' || platform === 'mailchimp' ? platform : 'none';

  const settings: AppSettings = {
    tiers,
    programName: typeof body.programName === 'string' ? body.programName : DEFAULT_PROGRAM_NAME,
    websiteUrl: typeof body.websiteUrl === 'string' ? body.websiteUrl : DEFAULT_WEBSITE_URL,
    adminEmail: typeof body.adminEmail === 'string' ? body.adminEmail : current.adminEmail,
    adminEmails: typeof body.adminEmails === 'string' ? body.adminEmails : current.adminEmails,
    cookieDurationDays: typeof body.cookieDurationDays === 'number'
      ? body.cookieDurationDays
      : (Number(body.cookieDurationDays) || DEFAULT_COOKIE_DAYS),
    wcStoreUrl: typeof body.wcStoreUrl === 'string' ? body.wcStoreUrl : current.wcStoreUrl,
    wcConsumerKey: typeof body.wcConsumerKey === 'string' ? body.wcConsumerKey : current.wcConsumerKey,
    wcConsumerSecret: typeof body.wcConsumerSecret === 'string' ? body.wcConsumerSecret : current.wcConsumerSecret,
    tipaltiApiKey: typeof body.tipaltiApiKey === 'string' ? body.tipaltiApiKey : current.tipaltiApiKey,
    tipaltiPayerName: typeof body.tipaltiPayerName === 'string' ? body.tipaltiPayerName : current.tipaltiPayerName,
    tipaltiSandbox: typeof body.tipaltiSandbox === 'boolean' ? body.tipaltiSandbox : body.tipaltiSandbox === 'true' || current.tipaltiSandbox,
    emailMarketingPlatform,
    klaviyoApiKey: typeof body.klaviyoApiKey === 'string' ? body.klaviyoApiKey : current.klaviyoApiKey,
    klaviyoAffiliateListId: typeof body.klaviyoAffiliateListId === 'string' ? body.klaviyoAffiliateListId : current.klaviyoAffiliateListId,
    mailchimpApiKey: typeof body.mailchimpApiKey === 'string' ? body.mailchimpApiKey : current.mailchimpApiKey,
    mailchimpServerPrefix: typeof body.mailchimpServerPrefix === 'string' ? body.mailchimpServerPrefix : current.mailchimpServerPrefix,
    mailchimpAffiliateListId: typeof body.mailchimpAffiliateListId === 'string' ? body.mailchimpAffiliateListId : current.mailchimpAffiliateListId,
    emailMarketingLastSyncAt: current.emailMarketingLastSyncAt,
    emailMarketingSyncedCount: current.emailMarketingSyncedCount,
  };

  await saveSettings(settings);

  // Re-evaluate all affiliates against new thresholds (current month revenue -> tier index)
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const affiliates = await prisma.affiliate.findMany({
    include: { conversions: true },
  });

  for (const aff of affiliates) {
    const monthlyRevenue = aff.conversions
      .filter((c) => {
        const d = new Date(c.createdAt);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .reduce((s, c) => s + c.amount, 0);

    const tierIndex = getTierIndexForRevenue(monthlyRevenue, settings.tiers);
    await prisma.affiliate.update({
      where: { id: aff.id },
      data: { tier: String(tierIndex) },
    });
  }

  return NextResponse.json(await getSettings());
}
