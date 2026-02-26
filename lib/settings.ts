import { prisma } from '@/lib/prisma';

export type TierRow = {
  name: string;
  commission: number;
  mlm2: number;
  mlm3: number;
  threshold: number;
};

export const DEFAULT_TIERS: TierRow[] = [
  { name: 'Silver', commission: 10, mlm2: 3, mlm3: 1, threshold: 0 },
  { name: 'Gold', commission: 15, mlm2: 4, mlm3: 1.5, threshold: 2000 },
  { name: 'Master', commission: 20, mlm2: 5, mlm3: 2, threshold: 5000 },
];

export const DEFAULT_PROGRAM_NAME = 'Biolongevity Labs Affiliate Program';
export const DEFAULT_WEBSITE_URL = 'https://biolongevitylabs.com';
export const DEFAULT_COOKIE_DAYS = 30;


export type EmailMarketingPlatform = 'none' | 'klaviyo' | 'mailchimp';

export type AppSettings = {
  tiers: TierRow[];
  programName: string;
  websiteUrl: string;
  adminEmail: string;
  /** Comma-separated list of admin emails (takes precedence for isAdmin check) */
  adminEmails: string;
  cookieDurationDays: number;
  wcStoreUrl: string;
  wcConsumerKey: string;
  wcConsumerSecret: string;
  tipaltiApiKey: string;
  tipaltiPayerName: string;
  tipaltiSandbox: boolean;
  /** Email marketing: none | klaviyo | mailchimp */
  emailMarketingPlatform: EmailMarketingPlatform;
  klaviyoApiKey: string;
  klaviyoAffiliateListId: string;
  mailchimpApiKey: string;
  mailchimpServerPrefix: string;
  mailchimpAffiliateListId: string;
  emailMarketingLastSyncAt: string;
  emailMarketingSyncedCount: string;
};

const SETTINGS_KEYS = {
  tiers: 'tiers',
  programName: 'programName',
  websiteUrl: 'websiteUrl',
  adminEmail: 'adminEmail',
  adminEmails: 'adminEmails',
  cookieDurationDays: 'cookieDurationDays',
  wcStoreUrl: 'wcStoreUrl',
  wcConsumerKey: 'wcConsumerKey',
  wcConsumerSecret: 'wcConsumerSecret',
  tipaltiApiKey: 'tipaltiApiKey',
  tipaltiPayerName: 'tipaltiPayerName',
  tipaltiSandbox: 'tipaltiSandbox',
  emailMarketingPlatform: 'emailMarketingPlatform',
  klaviyoApiKey: 'klaviyoApiKey',
  klaviyoAffiliateListId: 'klaviyoAffiliateListId',
  mailchimpApiKey: 'mailchimpApiKey',
  mailchimpServerPrefix: 'mailchimpServerPrefix',
  mailchimpAffiliateListId: 'mailchimpAffiliateListId',
  emailMarketingLastSyncAt: 'emailMarketingLastSyncAt',
  emailMarketingSyncedCount: 'emailMarketingSyncedCount',
} as const;

function getDefaultSettings(): AppSettings {
  return {
    tiers: [...DEFAULT_TIERS],
    programName: DEFAULT_PROGRAM_NAME,
    websiteUrl: DEFAULT_WEBSITE_URL,
    adminEmail: '',
    adminEmails: '',
    cookieDurationDays: DEFAULT_COOKIE_DAYS,
    wcStoreUrl: '',
    wcConsumerKey: '',
    wcConsumerSecret: '',
    tipaltiApiKey: '',
    tipaltiPayerName: '',
    tipaltiSandbox: true,
    emailMarketingPlatform: 'none',
    klaviyoApiKey: '',
    klaviyoAffiliateListId: '',
    mailchimpApiKey: '',
    mailchimpServerPrefix: '',
    mailchimpAffiliateListId: '',
    emailMarketingLastSyncAt: '',
    emailMarketingSyncedCount: '0',
  };
}

export async function getSettings(): Promise<AppSettings> {
  const settingsDelegate = prisma.settings;
  if (!settingsDelegate?.findMany) {
    return getDefaultSettings();
  }
  const rows = await settingsDelegate.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));

  const tiersRaw = map.get(SETTINGS_KEYS.tiers);
  const tiers: TierRow[] = tiersRaw
    ? (JSON.parse(tiersRaw) as TierRow[])
    : [...DEFAULT_TIERS];

  const platform = map.get(SETTINGS_KEYS.emailMarketingPlatform);
  const emailMarketingPlatform: EmailMarketingPlatform =
    platform === 'klaviyo' || platform === 'mailchimp' ? platform : 'none';

  return {
    tiers,
    programName: map.get(SETTINGS_KEYS.programName) ?? DEFAULT_PROGRAM_NAME,
    websiteUrl: map.get(SETTINGS_KEYS.websiteUrl) ?? DEFAULT_WEBSITE_URL,
    adminEmail: map.get(SETTINGS_KEYS.adminEmail) ?? '',
    adminEmails: map.get(SETTINGS_KEYS.adminEmails) ?? '',
    cookieDurationDays: parseInt(map.get(SETTINGS_KEYS.cookieDurationDays) ?? String(DEFAULT_COOKIE_DAYS), 10) || DEFAULT_COOKIE_DAYS,
    wcStoreUrl: map.get(SETTINGS_KEYS.wcStoreUrl) ?? '',
    wcConsumerKey: map.get(SETTINGS_KEYS.wcConsumerKey) ?? '',
    wcConsumerSecret: map.get(SETTINGS_KEYS.wcConsumerSecret) ?? '',
    tipaltiApiKey: map.get(SETTINGS_KEYS.tipaltiApiKey) ?? '',
    tipaltiPayerName: map.get(SETTINGS_KEYS.tipaltiPayerName) ?? '',
    tipaltiSandbox: map.get(SETTINGS_KEYS.tipaltiSandbox) !== 'false',
    emailMarketingPlatform,
    klaviyoApiKey: map.get(SETTINGS_KEYS.klaviyoApiKey) ?? '',
    klaviyoAffiliateListId: map.get(SETTINGS_KEYS.klaviyoAffiliateListId) ?? '',
    mailchimpApiKey: map.get(SETTINGS_KEYS.mailchimpApiKey) ?? '',
    mailchimpServerPrefix: map.get(SETTINGS_KEYS.mailchimpServerPrefix) ?? '',
    mailchimpAffiliateListId: map.get(SETTINGS_KEYS.mailchimpAffiliateListId) ?? '',
    emailMarketingLastSyncAt: map.get(SETTINGS_KEYS.emailMarketingLastSyncAt) ?? '',
    emailMarketingSyncedCount: map.get(SETTINGS_KEYS.emailMarketingSyncedCount) ?? '0',
  };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const upsert = (key: string, value: string) =>
    prisma.settings.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });

  await prisma.$transaction([
    upsert(SETTINGS_KEYS.tiers, JSON.stringify(settings.tiers)),
    upsert(SETTINGS_KEYS.programName, settings.programName),
    upsert(SETTINGS_KEYS.websiteUrl, settings.websiteUrl),
    upsert(SETTINGS_KEYS.adminEmail, settings.adminEmail),
    upsert(SETTINGS_KEYS.adminEmails, settings.adminEmails),
    upsert(SETTINGS_KEYS.cookieDurationDays, String(settings.cookieDurationDays)),
    upsert(SETTINGS_KEYS.wcStoreUrl, settings.wcStoreUrl),
    upsert(SETTINGS_KEYS.wcConsumerKey, settings.wcConsumerKey),
    upsert(SETTINGS_KEYS.wcConsumerSecret, settings.wcConsumerSecret),
    upsert(SETTINGS_KEYS.tipaltiApiKey, settings.tipaltiApiKey),
    upsert(SETTINGS_KEYS.tipaltiPayerName, settings.tipaltiPayerName),
    upsert(SETTINGS_KEYS.tipaltiSandbox, settings.tipaltiSandbox ? 'true' : 'false'),
    upsert(SETTINGS_KEYS.emailMarketingPlatform, settings.emailMarketingPlatform),
    upsert(SETTINGS_KEYS.klaviyoApiKey, settings.klaviyoApiKey),
    upsert(SETTINGS_KEYS.klaviyoAffiliateListId, settings.klaviyoAffiliateListId),
    upsert(SETTINGS_KEYS.mailchimpApiKey, settings.mailchimpApiKey),
    upsert(SETTINGS_KEYS.mailchimpServerPrefix, settings.mailchimpServerPrefix),
    upsert(SETTINGS_KEYS.mailchimpAffiliateListId, settings.mailchimpAffiliateListId),
    upsert(SETTINGS_KEYS.emailMarketingLastSyncAt, settings.emailMarketingLastSyncAt),
    upsert(SETTINGS_KEYS.emailMarketingSyncedCount, settings.emailMarketingSyncedCount),
  ]);
}

/** Returns true if the given email is in the admin list (adminEmails comma-separated or legacy adminEmail). */
export async function isAdmin(email: string | undefined | null): Promise<boolean> {
  if (!email || typeof email !== 'string') return false;
  const settings = await getSettings();
  const normalized = email.trim().toLowerCase();
  if (settings.adminEmails) {
    const list = settings.adminEmails.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
    if (list.includes(normalized)) return true;
  }
  if (settings.adminEmail && settings.adminEmail.trim().toLowerCase() === normalized) return true;
  // Bootstrap: when no admin is set in Settings yet, allow FIRST_ADMIN_EMAIL or ADMIN_EMAIL from env
  const noAdminConfigured = !settings.adminEmails?.trim() && !settings.adminEmail?.trim();
  if (noAdminConfigured) {
    const bootstrap = (process.env.FIRST_ADMIN_EMAIL || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    if (bootstrap && normalized === bootstrap) return true;
  }
  return false;
}

/** Get tier index (0-based) for a given monthly revenue based on tier thresholds (tiers ordered lowest to highest). */
export function getTierIndexForRevenue(monthlyRevenue: number, tiers: TierRow[]): number {
  let index = 0;
  for (let i = 0; i < tiers.length; i++) {
    if (monthlyRevenue >= tiers[i].threshold) index = i;
  }
  return index;
}

/** Re-evaluate all affiliates' tiers from current-month conversion revenue. Call after conversions change. */
export async function recalculateTiers(): Promise<void> {
  const settings = await getSettings();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const affiliates = await prisma.affiliate.findMany({
    where: { deletedAt: null },
    include: { conversions: true },
  });

  const { logActivity } = await import('@/lib/activity');

  for (const aff of affiliates) {
    const monthlyRevenue = aff.conversions
      .filter((c) => {
        const d = new Date(c.createdAt);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .reduce((s, c) => s + c.amount, 0);

    const tierIndex = getTierIndexForRevenue(monthlyRevenue, settings.tiers);
    const oldIndex = parseInt(aff.tier, 10) || 0;
    if (tierIndex !== oldIndex) {
      const updated = await prisma.affiliate.update({
        where: { id: aff.id },
        data: { tier: String(tierIndex) },
      });
      if (tierIndex > oldIndex) {
        const newTierName = settings.tiers[tierIndex]?.name ?? 'Unknown';
        await logActivity({
          type: 'tier_upgrade',
          message: `${aff.name} upgraded to ${newTierName} tier`,
          affiliateId: aff.id,
        });
      }
      try {
        const { syncAffiliate } = await import('@/lib/emailMarketing');
        await syncAffiliate({ id: updated.id, name: updated.name, email: updated.email, tier: updated.tier });
      } catch {
        // non-blocking
      }
    }
  }
}
