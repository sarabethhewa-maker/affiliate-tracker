import crypto from 'crypto';
import { getSettings, saveSettings } from '@/lib/settings';
import { prisma } from '@/lib/prisma';
import type { EmailMarketingPlatform } from '@/lib/settings';

function md5Email(email: string): string {
  return crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex');
}

export type AffiliateForSync = {
  id: string;
  name: string;
  email: string;
  tier?: string;
  [key: string]: unknown;
};

/** Resolve API key and list ID from settings, with env fallback. */
function getKlaviyoConfig() {
  const key = process.env.KLAVIYO_API_KEY;
  const listId = process.env.KLAVIYO_AFFILIATE_LIST_ID;
  return { key, listId };
}

function getMailchimpConfig() {
  const key = process.env.MAILCHIMP_API_KEY;
  const server = process.env.MAILCHIMP_SERVER_PREFIX;
  const listId = process.env.MAILCHIMP_AFFILIATE_LIST_ID;
  return { key, server, listId };
}

/** Sync affiliate to the configured platform (Klaviyo or Mailchimp). No-op if platform is none or missing config. */
export async function syncAffiliate(affiliate: AffiliateForSync): Promise<void> {
  const settings = await getSettings();
  if (settings.emailMarketingPlatform === 'none') return;

  const apiKey = settings.klaviyoApiKey || getKlaviyoConfig().key;
  const listId = settings.klaviyoAffiliateListId || getKlaviyoConfig().listId;
  const mcKey = settings.mailchimpApiKey || getMailchimpConfig().key;
  const mcServer = settings.mailchimpServerPrefix || getMailchimpConfig().server;
  const mcListId = settings.mailchimpAffiliateListId || getMailchimpConfig().listId;

  if (settings.emailMarketingPlatform === 'klaviyo') {
    if (!apiKey || !listId) return;
    await syncAffiliateKlaviyo(apiKey, listId, affiliate);
    return;
  }
  if (settings.emailMarketingPlatform === 'mailchimp') {
    if (!mcKey || !mcServer || !mcListId) return;
    await syncAffiliateMailchimp(mcKey, mcServer, mcListId, affiliate);
  }
}

/** Remove affiliate from the configured list (by email). */
export async function removeAffiliate(affiliateId: string): Promise<void> {
  const settings = await getSettings();
  if (settings.emailMarketingPlatform === 'none') return;

  const aff = await prisma.affiliate.findUnique({ where: { id: affiliateId }, select: { email: true } });
  if (!aff?.email) return;

  const apiKey = settings.klaviyoApiKey || getKlaviyoConfig().key;
  const listId = settings.klaviyoAffiliateListId || getKlaviyoConfig().listId;
  const mcKey = settings.mailchimpApiKey || getMailchimpConfig().key;
  const mcServer = settings.mailchimpServerPrefix || getMailchimpConfig().server;
  const mcListId = settings.mailchimpAffiliateListId || getMailchimpConfig().listId;

  if (settings.emailMarketingPlatform === 'klaviyo') {
    if (!apiKey || !listId) return;
    await removeAffiliateKlaviyo(apiKey, listId, aff.email);
    return;
  }
  if (settings.emailMarketingPlatform === 'mailchimp') {
    if (!mcKey || !mcServer || !mcListId) return;
    await removeAffiliateMailchimp(mcKey, mcServer, mcListId, aff.email);
  }
}

/** Update affiliate properties on the configured platform (upsert by email). */
export async function updateAffiliateProperties(affiliate: AffiliateForSync): Promise<void> {
  await syncAffiliate(affiliate);
}

// --- Klaviyo (REST) ---
const KLAVIYO_REVISION = '2024-02-15';

async function syncAffiliateKlaviyo(apiKey: string, listId: string, affiliate: AffiliateForSync): Promise<void> {
  const res = await fetch('https://a.klaviyo.com/api/profiles/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      revision: KLAVIYO_REVISION,
      Authorization: `Klaviyo-API-Key ${apiKey}`,
    },
    body: JSON.stringify({
      data: {
        type: 'profile',
        attributes: {
          email: affiliate.email,
          first_name: affiliate.name?.split(' ')[0] ?? affiliate.name,
          last_name: affiliate.name?.split(' ').slice(1).join(' ') || undefined,
          properties: {
            affiliate_id: affiliate.id,
            tier: affiliate.tier ?? '',
          },
        },
      },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Klaviyo profile: ${res.status} ${err}`);
  }
  const data = (await res.json()) as { data?: { id?: string } };
  const profileId = data.data?.id;
  if (!profileId) throw new Error('Klaviyo profile id missing');

  const addRes = await fetch(`https://a.klaviyo.com/api/lists/${listId}/relationships/profiles/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      revision: KLAVIYO_REVISION,
      Authorization: `Klaviyo-API-Key ${apiKey}`,
    },
    body: JSON.stringify({
      data: [{ type: 'profile', id: profileId }],
    }),
  });
  if (!addRes.ok && addRes.status !== 409) {
    const err = await addRes.text();
    throw new Error(`Klaviyo add to list: ${addRes.status} ${err}`);
  }
}

async function removeAffiliateKlaviyo(apiKey: string, listId: string, email: string): Promise<void> {
  const listRes = await fetch(
    `https://a.klaviyo.com/api/lists/${listId}/profiles/?filter=equals(email,"${encodeURIComponent(email)}")`,
    {
      headers: {
        Accept: 'application/json',
        revision: KLAVIYO_REVISION,
        Authorization: `Klaviyo-API-Key ${apiKey}`,
      },
    }
  );
  if (!listRes.ok) return;
  const listData = (await listRes.json()) as { data?: { id: string }[] };
  const profileIds = listData.data?.map((d) => d.id) ?? [];
  if (profileIds.length === 0) return;

  await fetch(`https://a.klaviyo.com/api/lists/${listId}/relationships/profiles/`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      revision: KLAVIYO_REVISION,
      Authorization: `Klaviyo-API-Key ${apiKey}`,
    },
    body: JSON.stringify({
      data: profileIds.map((id) => ({ type: 'profile', id })),
    }),
  });
}

// --- Mailchimp ---
async function syncAffiliateMailchimp(
  apiKey: string,
  server: string,
  listId: string,
  affiliate: AffiliateForSync
): Promise<void> {
  const { default: mailchimp } = await import('@mailchimp/mailchimp_marketing');
  mailchimp.setConfig({
    apiKey,
    server: server.replace(/^https?:\/\//, '').split('.')[0] || server,
  });

  const subscriberHash = md5Email(affiliate.email);
  try {
    await mailchimp.lists.setListMember(listId, subscriberHash, {
      email_address: affiliate.email,
      status_if_new: 'subscribed',
      status: 'subscribed',
      merge_fields: {
        FNAME: affiliate.name?.split(' ')[0] ?? affiliate.name ?? '',
        LNAME: affiliate.name?.split(' ').slice(1).join(' ') ?? '',
      },
    });
  } catch (e: unknown) {
    const err = e as { status?: number };
    if (err.status === 404) {
      await mailchimp.lists.addListMember(listId, {
        email_address: affiliate.email,
        status: 'subscribed',
        merge_fields: {
          FNAME: affiliate.name?.split(' ')[0] ?? affiliate.name ?? '',
          LNAME: affiliate.name?.split(' ').slice(1).join(' ') ?? '',
        },
      });
    } else {
      throw e;
    }
  }
}

async function removeAffiliateMailchimp(apiKey: string, server: string, listId: string, email: string): Promise<void> {
  const { default: mailchimp } = await import('@mailchimp/mailchimp_marketing');
  mailchimp.setConfig({
    apiKey,
    server: server.replace(/^https?:\/\//, '').split('.')[0] || server,
  });
  const subscriberHash = md5Email(email);
  try {
    await mailchimp.lists.deleteListMember(listId, subscriberHash);
  } catch {
    // 404 or already removed
  }
}

/** Test connection to the configured platform. Returns error message or null on success. */
export async function testConnection(platform: EmailMarketingPlatform): Promise<string | null> {
  if (platform === 'none') return 'No platform selected';
  const settings = await getSettings();

  if (platform === 'klaviyo') {
    const apiKey = settings.klaviyoApiKey || getKlaviyoConfig().key;
    const listId = settings.klaviyoAffiliateListId || getKlaviyoConfig().listId;
    if (!apiKey || !listId) return 'Missing Klaviyo API key or List ID';
    try {
      const res = await fetch('https://a.klaviyo.com/api/lists/', {
        headers: {
          Accept: 'application/json',
          revision: KLAVIYO_REVISION,
          Authorization: `Klaviyo-API-Key ${apiKey}`,
        },
      });
      if (!res.ok) return `Klaviyo: ${res.status} ${await res.text()}`;
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : 'Klaviyo connection failed';
    }
  }

  if (platform === 'mailchimp') {
    const apiKey = settings.mailchimpApiKey || getMailchimpConfig().key;
    const server = settings.mailchimpServerPrefix || getMailchimpConfig().server;
    const listId = settings.mailchimpAffiliateListId || getMailchimpConfig().listId;
    if (!apiKey || !server || !listId) return 'Missing Mailchimp API key, server prefix, or List ID';
    try {
      const { default: mailchimp } = await import('@mailchimp/mailchimp_marketing');
      mailchimp.setConfig({
        apiKey,
        server: server.replace(/^https?:\/\//, '').split('.')[0] || server,
      });
      await mailchimp.ping.get();
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : 'Mailchimp connection failed';
    }
  }

  return 'Unknown platform';
}

/** Sync all active affiliates to the configured platform and update lastSyncAt / syncedCount in settings. */
export async function syncAllAffiliates(): Promise<{ synced: number; error?: string }> {
  const settings = await getSettings();
  if (settings.emailMarketingPlatform === 'none') {
    return { synced: 0, error: 'No platform selected' };
  }

  const affiliates = await prisma.affiliate.findMany({
    where: { status: 'active' },
    select: { id: true, name: true, email: true, tier: true },
  });

  let synced = 0;
  for (const aff of affiliates) {
    try {
      await syncAffiliate(aff);
      synced++;
    } catch {
      // continue with next
    }
  }

  const updated = await getSettings();
  await saveSettings({
    ...updated,
    emailMarketingLastSyncAt: new Date().toISOString(),
    emailMarketingSyncedCount: String(synced),
  });
  return { synced };
}
