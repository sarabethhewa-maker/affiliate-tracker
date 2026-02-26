"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { AppSettings, TierRow } from "@/lib/settings";
import { DEFAULT_TIERS, DEFAULT_PROGRAM_NAME, DEFAULT_WEBSITE_URL, DEFAULT_COOKIE_DAYS } from "@/lib/settings";

const defaultSettings: AppSettings = {
  tiers: [...DEFAULT_TIERS],
  programName: DEFAULT_PROGRAM_NAME,
  websiteUrl: DEFAULT_WEBSITE_URL,
  adminEmail: "",
  adminEmails: "",
  cookieDurationDays: DEFAULT_COOKIE_DAYS,
  wcStoreUrl: "",
  wcConsumerKey: "",
  wcConsumerSecret: "",
  tipaltiApiKey: "",
  tipaltiPayerName: "",
  tipaltiSandbox: true,
  emailMarketingPlatform: "none",
  klaviyoApiKey: "",
  klaviyoAffiliateListId: "",
  mailchimpApiKey: "",
  mailchimpServerPrefix: "",
  mailchimpAffiliateListId: "",
  emailMarketingLastSyncAt: "",
  emailMarketingSyncedCount: "0",
};

/** Build TIERS record keyed by index "0","1","2" for dashboard display. */
const TIER_COLORS = [
  { color: "#1e3a5f", bg: "#e0f2fe" },
  { color: "#c2410c", bg: "#ffedd5" },
  { color: "#b45309", bg: "#fef3c7" },
  { color: "#6d28d9", bg: "#ede9fe" },
  { color: "#0d7a3d", bg: "#dcfce7" },
];

function buildTIERSFromSettings(tiers: TierRow[]): Record<string, { label: string; color: string; bg: string; commission: number; mlm2: number; mlm3: number }> {
  const out: Record<string, { label: string; color: string; bg: string; commission: number; mlm2: number; mlm3: number }> = {};
  tiers.forEach((t, i) => {
    const colors = TIER_COLORS[i % TIER_COLORS.length];
    out[String(i)] = {
      label: t.name,
      color: colors.color,
      bg: colors.bg,
      commission: t.commission,
      mlm2: t.mlm2,
      mlm3: t.mlm3,
    };
  });
  return out;
}

function getVolumeTierFromSettings(
  monthlyRevenue: number,
  tiers: TierRow[]
): { tierKey: string; rate: number; nextThreshold: number | null; progress: number } {
  if (!tiers.length) return { tierKey: "0", rate: 10, nextThreshold: null, progress: 1 };
  let index = 0;
  for (let i = 0; i < tiers.length; i++) {
    if (monthlyRevenue >= tiers[i].threshold) index = i;
  }
  const tier = tiers[index];
  const nextTier = tiers[index + 1];
  const nextThreshold = nextTier ? nextTier.threshold : null;
  const progress = nextThreshold != null ? Math.min(1, monthlyRevenue / nextThreshold) : 1;
  return {
    tierKey: String(index),
    rate: tier.commission,
    nextThreshold,
    progress,
  };
}

type SettingsContextValue = {
  settings: AppSettings;
  loading: boolean;
  refetch: () => Promise<void>;
  TIERS: Record<string, { label: string; color: string; bg: string; commission: number; mlm2: number; mlm3: number }>;
  getVolumeTier: (monthlyRevenue: number) => { tierKey: string; rate: number; nextThreshold: number | null; progress: number };
};

const defaultTiers = buildTIERSFromSettings(defaultSettings.tiers);
const defaultGetVolumeTier = (rev: number) => getVolumeTierFromSettings(rev, defaultSettings.tiers);

const SettingsContext = createContext<SettingsContextValue>({
  settings: defaultSettings,
  loading: true,
  refetch: async () => {},
  TIERS: defaultTiers,
  getVolumeTier: defaultGetVolumeTier,
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch {
      // keep defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const TIERS = React.useMemo(() => buildTIERSFromSettings(settings.tiers), [settings.tiers]);
  const getVolumeTier = React.useCallback((monthlyRevenue: number) => getVolumeTierFromSettings(monthlyRevenue, settings.tiers), [settings.tiers]);

  return (
    <SettingsContext.Provider value={{ settings, loading, refetch, TIERS, getVolumeTier }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

/** Resolve affiliate.tier (may be legacy "silver"|"gold"|"master" or index "0"|"1"|"2") to tier key for display. */
export function resolveTierKey(storedTier: string, tierCount: number): string {
  if (/^\d+$/.test(storedTier)) {
    const i = parseInt(storedTier, 10);
    return String(Math.min(i, Math.max(0, tierCount - 1)));
  }
  const legacy: Record<string, string> = { silver: "0", gold: "1", master: "2" };
  return legacy[storedTier] ?? "0";
}
