"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSettings } from "@/app/contexts/SettingsContext";
import type { TierRow } from "@/lib/settings";
import type { EmailMarketingPlatform } from "@/lib/settings";
import { DEFAULT_TIERS, DEFAULT_PROGRAM_NAME, DEFAULT_WEBSITE_URL, DEFAULT_COOKIE_DAYS } from "@/lib/settings";

const THEME = {
  bg: "#f8fafc",
  card: "#ffffff",
  border: "#e2e8f0",
  text: "#1a1a1a",
  textMuted: "#4a5568",
  accent: "#1e3a5f",
  accentLight: "#3a7ca5",
  success: "#0d7a3d",
  error: "#b91c1c",
};

export default function SettingsPage() {
  const { settings: initial, loading, refetch } = useSettings();
  const [tiers, setTiers] = useState<TierRow[]>([]);
  const [programName, setProgramName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminEmails, setAdminEmails] = useState("");
  const [cookieDurationDays, setCookieDurationDays] = useState(DEFAULT_COOKIE_DAYS);
  const [wcStoreUrl, setWcStoreUrl] = useState("");
  const [wcConsumerKey, setWcConsumerKey] = useState("");
  const [wcConsumerSecret, setWcConsumerSecret] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [wcTestResult, setWcTestResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [wcSyncing, setWcSyncing] = useState(false);
  const [tipaltiApiKey, setTipaltiApiKey] = useState("");
  const [tipaltiPayerName, setTipaltiPayerName] = useState("");
  const [tipaltiSandbox, setTipaltiSandbox] = useState(true);
  const [tipaltiTestResult, setTipaltiTestResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [digestSending, setDigestSending] = useState(false);
  const [digestResult, setDigestResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [emailMarketingPlatform, setEmailMarketingPlatform] = useState<EmailMarketingPlatform>("none");
  const [klaviyoApiKey, setKlaviyoApiKey] = useState("");
  const [klaviyoAffiliateListId, setKlaviyoAffiliateListId] = useState("");
  const [mailchimpApiKey, setMailchimpApiKey] = useState("");
  const [mailchimpServerPrefix, setMailchimpServerPrefix] = useState("");
  const [mailchimpAffiliateListId, setMailchimpAffiliateListId] = useState("");
  const [emailMarketingTestResult, setEmailMarketingTestResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [emailMarketingSyncing, setEmailMarketingSyncing] = useState(false);
  const [emailMarketingSyncResult, setEmailMarketingSyncResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [settingsTab, setSettingsTab] = useState<"main" | "tracking">("main");
  const [trackingTestSlug, setTrackingTestSlug] = useState("");
  const [trackingTestResult, setTrackingTestResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [webhookConfigured, setWebhookConfigured] = useState<boolean | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [dangerZoneOpen, setDangerZoneOpen] = useState(false);
  const [deleteAllStep, setDeleteAllStep] = useState<1 | 2 | 3 | null>(null);
  const [deleteAllConfirmText, setDeleteAllConfirmText] = useState("");
  const [deleteAllCountdown, setDeleteAllCountdown] = useState<number | null>(null);
  const [deleteAllProgress, setDeleteAllProgress] = useState(false);
  const deleteAllCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (deleteAllStep !== 3 || deleteAllCountdown === null) return;
    if (deleteAllCountdown <= 0) {
      setDeleteAllCountdown(null);
      setDeleteAllStep(null);
      setDeleteAllProgress(true);
      (async () => {
        try {
          const res = await fetch("/api/admin/delete-all-affiliates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmation: "DELETE ALL AFFILIATES" }) });
          if (res.ok) {
            setMessage({ type: "ok", text: "All affiliate data has been cleared. The system is ready for fresh data." });
            refetch();
          } else {
            const data = await res.json().catch(() => ({}));
            setMessage({ type: "err", text: data.error || "Delete failed" });
          }
        } finally {
          setDeleteAllProgress(false);
        }
      })();
      return;
    }
    const id = setInterval(() => {
      setDeleteAllCountdown((c) => (c === null ? null : c - 1));
    }, 1000);
    deleteAllCountdownRef.current = id;
    return () => {
      clearInterval(id);
      deleteAllCountdownRef.current = null;
    };
  }, [deleteAllStep, deleteAllCountdown, refetch]);

  useEffect(() => {
    setTiers(initial.tiers.length ? initial.tiers : [...DEFAULT_TIERS]);
    setProgramName(initial.programName || DEFAULT_PROGRAM_NAME);
    setWebsiteUrl(initial.websiteUrl || DEFAULT_WEBSITE_URL);
    setAdminEmail(initial.adminEmail || "");
    setAdminEmails(initial.adminEmails ?? "");
    setCookieDurationDays(initial.cookieDurationDays ?? DEFAULT_COOKIE_DAYS);
    setWcStoreUrl(initial.wcStoreUrl ?? "");
    setWcConsumerKey(initial.wcConsumerKey ?? "");
    setWcConsumerSecret(initial.wcConsumerSecret ?? "");
    setTipaltiApiKey(initial.tipaltiApiKey ?? "");
    setTipaltiPayerName(initial.tipaltiPayerName ?? "");
    setTipaltiSandbox(initial.tipaltiSandbox ?? true);
    setEmailMarketingPlatform(initial.emailMarketingPlatform ?? "none");
    setKlaviyoApiKey(initial.klaviyoApiKey ?? "");
    setKlaviyoAffiliateListId(initial.klaviyoAffiliateListId ?? "");
    setMailchimpApiKey(initial.mailchimpApiKey ?? "");
    setMailchimpServerPrefix(initial.mailchimpServerPrefix ?? "");
    setMailchimpAffiliateListId(initial.mailchimpAffiliateListId ?? "");
  }, [initial.tiers, initial.programName, initial.websiteUrl, initial.adminEmail, initial.adminEmails, initial.cookieDurationDays, initial.tiers.length, initial.wcStoreUrl, initial.wcConsumerKey, initial.wcConsumerSecret, initial.tipaltiApiKey, initial.tipaltiPayerName, initial.tipaltiSandbox, initial.emailMarketingPlatform, initial.klaviyoApiKey, initial.klaviyoAffiliateListId, initial.mailchimpApiKey, initial.mailchimpServerPrefix, initial.mailchimpAffiliateListId]);


  const addTier = () => {
    if (tiers.length >= 5) return;
    setTiers((t) => [...t, { name: "New Tier", commission: 10, mlm2: 3, mlm3: 1, threshold: 0 }]);
  };

  const removeTier = (index: number) => {
    if (tiers.length <= 1) return;
    setTiers((t) => t.filter((_, i) => i !== index));
  };

  const updateTier = (index: number, field: keyof TierRow, value: string | number) => {
    setTiers((t) => {
      const next = [...t];
      (next[index] as Record<string, unknown>)[field] = value;
      return next;
    });
  };

  const save = async () => {
    if (tiers.length < 1 || tiers.length > 5) {
      setMessage({ type: "err", text: "Keep between 1 and 5 tiers." });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tiers,
          programName,
          websiteUrl,
          adminEmail,
          adminEmails,
          cookieDurationDays: Number(cookieDurationDays) || DEFAULT_COOKIE_DAYS,
          wcStoreUrl,
          wcConsumerKey,
          wcConsumerSecret,
          tipaltiApiKey,
          tipaltiPayerName,
          tipaltiSandbox,
          emailMarketingPlatform,
          klaviyoApiKey,
          klaviyoAffiliateListId,
          mailchimpApiKey,
          mailchimpServerPrefix,
          mailchimpAffiliateListId,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save");
      }
      await refetch();
      setMessage({ type: "ok", text: "Settings saved. All affiliates have been re-evaluated against the new thresholds." });
    } catch (e) {
      setMessage({ type: "err", text: e instanceof Error ? e.message : "Failed to save" });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (settingsTab !== "tracking") return;
    fetch("/api/settings/webhook-status")
      .then((r) => r.json())
      .then((d) => setWebhookConfigured(d.configured ?? false))
      .catch(() => setWebhookConfigured(false));
  }, [settingsTab]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyFeedback(label);
      setTimeout(() => setCopyFeedback(null), 2000);
    });
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: THEME.bg, fontFamily: "'DM Sans', 'Segoe UI', sans-serif", padding: 32, color: THEME.textMuted }}>
        Loading settings…
      </div>
    );
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "https://affiliate-tracker-psi.vercel.app";
  const webhookUrl = origin + "/api/webhooks/woocommerce";
  const snippetUrl = origin + "/tracking-snippet.js";

  const phpSnippet = `// Enqueue BLL tracking snippet on all pages
add_action('wp_enqueue_scripts', function () {
  wp_enqueue_script(
    'bll-tracking',
    '${snippetUrl}',
    [],
    null,
    true
  );
});

// Add hidden checkout field (value set by JS from cookie)
add_action('woocommerce_checkout_after_customer_details', function () {
  echo '<input type="hidden" name="_bll_affiliate_ref" id="_bll_affiliate_ref" value="">';
});

// Save affiliate ref to order meta so webhook can attribute the order
add_action('woocommerce_checkout_update_order_meta', function ($order_id) {
  if (!empty($_POST['_bll_affiliate_ref'])) {
    update_post_meta($order_id, '_bll_affiliate_ref', sanitize_text_field($_POST['_bll_affiliate_ref']));
  }
});`;

  return (
    <div style={{ minHeight: "100vh", background: THEME.bg, fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: THEME.text, padding: "32px 40px", maxWidth: 900 }}>
      <style>{`* { box-sizing: border-box; } input, select { font-family: inherit; }`}</style>
      <Link href="/dashboard" style={{ display: "inline-block", marginBottom: 24, color: THEME.textMuted, fontSize: 13, textDecoration: "none" }}>← Back to Dashboard</Link>
      <Image src="/biolongevity-logo.png" alt="Biolongevity Labs" width={200} height={51} style={{ width: "auto", height: 40, objectFit: "contain", marginBottom: 16 }} />
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Settings</h1>
      <p style={{ color: THEME.textMuted, fontSize: 14, marginBottom: 24 }}>Configure your affiliate program. Changes apply app-wide and re-evaluate all affiliates when you save.</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 32, borderBottom: `1px solid ${THEME.border}`, paddingBottom: 8 }}>
        <button type="button" onClick={() => setSettingsTab("main")} style={{ padding: "8px 16px", background: settingsTab === "main" ? THEME.accent : "transparent", color: settingsTab === "main" ? "#fff" : THEME.textMuted, border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>Program &amp; integrations</button>
        <button type="button" onClick={() => setSettingsTab("tracking")} style={{ padding: "8px 16px", background: settingsTab === "tracking" ? THEME.accent : "transparent", color: settingsTab === "tracking" ? "#fff" : THEME.textMuted, border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>Tracking Setup</button>
      </div>

      {message && (
        <div style={{
          marginBottom: 24,
          padding: 16,
          borderRadius: 8,
          background: message.type === "ok" ? "#dcfce7" : "#fee2e2",
          color: message.type === "ok" ? THEME.success : THEME.error,
          fontSize: 14,
        }}>
          {message.text}
        </div>
      )}

      {settingsTab === "main" && (
        <>
      {/* Tier Settings */}
      <section style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Tier Settings</h2>
        <p style={{ color: THEME.textMuted, fontSize: 13, marginBottom: 16 }}>Rename tiers and set commission and MLM override percentages. Min 1, max 5 tiers.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {tiers.map((tier, i) => (
            <div key={i} style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", padding: 12, background: THEME.bg, borderRadius: 8 }}>
              <input
                type="text"
                value={tier.name}
                onChange={(e) => updateTier(i, "name", e.target.value)}
                placeholder="Tier name"
                style={{ width: 120, padding: "8px 10px", border: `1px solid ${THEME.border}`, borderRadius: 6, fontSize: 13 }}
              />
              <label style={{ fontSize: 12, color: THEME.textMuted }}>Commission %</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={tier.commission}
                onChange={(e) => updateTier(i, "commission", Number(e.target.value) || 0)}
                style={{ width: 70, padding: "8px 10px", border: `1px solid ${THEME.border}`, borderRadius: 6, fontSize: 13 }}
              />
              <label style={{ fontSize: 12, color: THEME.textMuted }}>L2 %</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={tier.mlm2}
                onChange={(e) => updateTier(i, "mlm2", Number(e.target.value) || 0)}
                style={{ width: 60, padding: "8px 10px", border: `1px solid ${THEME.border}`, borderRadius: 6, fontSize: 13 }}
              />
              <label style={{ fontSize: 12, color: THEME.textMuted }}>L3 %</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={tier.mlm3}
                onChange={(e) => updateTier(i, "mlm3", Number(e.target.value) || 0)}
                style={{ width: 60, padding: "8px 10px", border: `1px solid ${THEME.border}`, borderRadius: 6, fontSize: 13 }}
              />
              <button
                type="button"
                onClick={() => removeTier(i)}
                disabled={tiers.length <= 1}
                style={{ padding: "8px 12px", background: tiers.length <= 1 ? "#e2e8f0" : "#fee2e2", color: tiers.length <= 1 ? THEME.textMuted : THEME.error, border: "none", borderRadius: 6, cursor: tiers.length <= 1 ? "not-allowed" : "pointer", fontSize: 12 }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addTier} disabled={tiers.length >= 5} style={{ marginTop: 12, padding: "8px 16px", background: tiers.length >= 5 ? "#e2e8f0" : THEME.accentLight, color: "#fff", border: "none", borderRadius: 6, cursor: tiers.length >= 5 ? "not-allowed" : "pointer", fontSize: 13 }}>Add Tier</button>
      </section>

      {/* Threshold Settings */}
      <section style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Threshold Settings</h2>
        <p style={{ color: THEME.textMuted, fontSize: 13, marginBottom: 16 }}>Monthly sales required to reach each tier (e.g. Silver $0+, Gold $2,000+, Master $5,000+).</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {tiers.map((tier, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 120, fontWeight: 600, fontSize: 14 }}>{tier.name}</span>
              <label style={{ fontSize: 12, color: THEME.textMuted }}>Min. monthly sales ($)</label>
              <input
                type="number"
                min={0}
                step={100}
                value={tier.threshold}
                onChange={(e) => updateTier(i, "threshold", Number(e.target.value) || 0)}
                style={{ width: 120, padding: "8px 10px", border: `1px solid ${THEME.border}`, borderRadius: 6, fontSize: 13 }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Program Settings */}
      <section style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Program Settings</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: THEME.textMuted, marginBottom: 6 }}>Program name</label>
            <input type="text" value={programName} onChange={(e) => setProgramName(e.target.value)} style={{ width: "100%", maxWidth: 400, padding: "10px 12px", border: `1px solid ${THEME.border}`, borderRadius: 8, fontSize: 14 }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: THEME.textMuted, marginBottom: 6 }}>Company website URL</label>
            <input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://..." style={{ width: "100%", maxWidth: 400, padding: "10px 12px", border: `1px solid ${THEME.border}`, borderRadius: 8, fontSize: 14 }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: THEME.textMuted, marginBottom: 6 }}>Admin notification email</label>
            <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="admin@example.com" style={{ width: "100%", maxWidth: 400, padding: "10px 12px", border: `1px solid ${THEME.border}`, borderRadius: 8, fontSize: 14 }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: THEME.textMuted, marginBottom: 6 }}>Admin emails (comma-separated)</label>
            <textarea value={adminEmails} onChange={(e) => setAdminEmails(e.target.value)} placeholder="admin@example.com, other@example.com" rows={2} style={{ width: "100%", maxWidth: 400, padding: "10px 12px", border: `1px solid ${THEME.border}`, borderRadius: 8, fontSize: 14 }} />
            <span style={{ display: "block", marginTop: 4, fontSize: 12, color: THEME.textMuted }}>Only these emails can access the admin dashboard (/, /settings, /how-to-use).</span>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: THEME.textMuted, marginBottom: 6 }}>Cookie duration (days)</label>
            <input type="number" min={1} max={365} value={cookieDurationDays} onChange={(e) => setCookieDurationDays(Number(e.target.value) || 30)} style={{ width: 100, padding: "10px 12px", border: `1px solid ${THEME.border}`, borderRadius: 8, fontSize: 14 }} />
            <span style={{ marginLeft: 8, fontSize: 13, color: THEME.textMuted }}>How long a click is tracked before expiring</span>
          </div>
        </div>
      </section>

      {/* WooCommerce */}
      <section style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>WooCommerce</h2>
        <p style={{ color: THEME.textMuted, fontSize: 13, marginBottom: 16 }}>Connect your store so completed orders are recorded as conversions. You can also set WOOCOMMERCE_WEBHOOK_SECRET, WC_STORE_URL, WC_CONSUMER_KEY, and WC_CONSUMER_SECRET in .env.local.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: THEME.textMuted, marginBottom: 6 }}>Store URL</label>
            <input type="url" value={wcStoreUrl} onChange={(e) => setWcStoreUrl(e.target.value)} placeholder="https://yoursite.com" style={{ width: "100%", maxWidth: 400, padding: "10px 12px", border: `1px solid ${THEME.border}`, borderRadius: 8, fontSize: 14 }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: THEME.textMuted, marginBottom: 6 }}>Consumer Key</label>
            <input type="text" value={wcConsumerKey} onChange={(e) => setWcConsumerKey(e.target.value)} placeholder="ck_..." style={{ width: "100%", maxWidth: 400, padding: "10px 12px", border: `1px solid ${THEME.border}`, borderRadius: 8, fontSize: 14 }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: THEME.textMuted, marginBottom: 6 }}>Consumer Secret</label>
            <input type="password" value={wcConsumerSecret} onChange={(e) => setWcConsumerSecret(e.target.value)} placeholder="cs_..." style={{ width: "100%", maxWidth: 400, padding: "10px 12px", border: `1px solid ${THEME.border}`, borderRadius: 8, fontSize: 14 }} />
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={async () => {
                setWcTestResult(null);
                const res = await fetch("/api/woocommerce/test", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ wcStoreUrl: wcStoreUrl.trim(), wcConsumerKey: wcConsumerKey.trim(), wcConsumerSecret: wcConsumerSecret.trim() }),
                });
                const data = await res.json().catch(() => ({}));
                setWcTestResult({ ok: !!data.ok, text: data.error || data.message || (data.ok ? "Connection successful" : "Connection failed") });
              }}
              style={{ padding: "8px 16px", background: THEME.accentLight, color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 }}
            >
              Test Connection
            </button>
            <button
              type="button"
              disabled={wcSyncing}
              onClick={async () => {
                setWcTestResult(null);
                setWcSyncing(true);
                try {
                  const res = await fetch("/api/woocommerce/sync", { method: "POST" });
                  const data = await res.json().catch(() => ({}));
                  if (!res.ok) setWcTestResult({ ok: false, text: data.error || "Sync failed" });
                  else setWcTestResult({ ok: true, text: data.created != null ? `Synced. ${data.created} new conversion(s) created.` : "Sync completed." });
                } catch {
                  setWcTestResult({ ok: false, text: "Sync failed" });
                } finally {
                  setWcSyncing(false);
                }
              }}
              style={{ padding: "8px 16px", background: wcSyncing ? "#cbd5e1" : THEME.success, color: "#fff", border: "none", borderRadius: 6, cursor: wcSyncing ? "not-allowed" : "pointer", fontSize: 13 }}
            >
              {wcSyncing ? "Syncing…" : "Manual Sync"}
            </button>
          </div>
          {wcTestResult && (
            <div style={{ padding: 12, borderRadius: 8, background: wcTestResult.ok ? "#dcfce7" : "#fee2e2", color: wcTestResult.ok ? THEME.success : THEME.error, fontSize: 13 }}>
              {wcTestResult.text}
            </div>
          )}
          <div style={{ marginTop: 8, padding: 14, background: THEME.bg, borderRadius: 8, fontSize: 12, color: THEME.textMuted }}>
            <strong style={{ color: THEME.text }}>Webhook setup</strong>: In WooCommerce → Settings → Advanced → Webhooks, create a webhook for <strong>Order updated</strong> pointing to: <code style={{ background: THEME.card, padding: "2px 6px", borderRadius: 4 }}>{typeof window !== "undefined" ? window.location.origin : ""}/api/webhooks/woocommerce</code>. Use the same secret in .env.local as <code>WOOCOMMERCE_WEBHOOK_SECRET</code>.
          </div>
        </div>
      </section>

      {/* Tipalti */}
      <section style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Tipalti</h2>
        <p style={{ color: THEME.textMuted, fontSize: 13, marginBottom: 16 }}>Automated mass payouts: sync affiliates to Tipalti and pay via the dashboard. Set TIPALTI_API_KEY, TIPALTI_PAYER_NAME, and TIPALTI_SANDBOX in .env.local, or use the fields below (saved with Settings).</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: THEME.textMuted, marginBottom: 6 }}>API Key</label>
            <input type="password" value={tipaltiApiKey} onChange={(e) => setTipaltiApiKey(e.target.value)} placeholder="From Tipalti" style={{ width: "100%", maxWidth: 400, padding: "10px 12px", border: `1px solid ${THEME.border}`, borderRadius: 8, fontSize: 14 }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: THEME.textMuted, marginBottom: 6 }}>Payer Name</label>
            <input type="text" value={tipaltiPayerName} onChange={(e) => setTipaltiPayerName(e.target.value)} placeholder="BiolongevityLabs" style={{ width: "100%", maxWidth: 400, padding: "10px 12px", border: `1px solid ${THEME.border}`, borderRadius: 8, fontSize: 14 }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input type="checkbox" id="tipaltiSandbox" checked={tipaltiSandbox} onChange={(e) => setTipaltiSandbox(e.target.checked)} />
            <label htmlFor="tipaltiSandbox" style={{ fontSize: 13, color: THEME.text }}>Sandbox (uncheck for production)</label>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={async () => {
                setTipaltiTestResult(null);
                const res = await fetch("/api/tipalti/test", { method: "POST" });
                const data = await res.json().catch(() => ({}));
                setTipaltiTestResult({ ok: !!data.ok, text: data.message || data.error || (data.ok ? "Connection successful" : "Connection failed") });
              }}
              style={{ padding: "8px 16px", background: THEME.accentLight, color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 }}
            >
              Test Connection
            </button>
          </div>
          {tipaltiTestResult && (
            <div style={{ padding: 12, borderRadius: 8, background: tipaltiTestResult.ok ? "#dcfce7" : "#fee2e2", color: tipaltiTestResult.ok ? THEME.success : THEME.error, fontSize: 13 }}>
              {tipaltiTestResult.text}
            </div>
          )}
          <div style={{ marginTop: 8, padding: 14, background: THEME.bg, borderRadius: 8, fontSize: 12, color: THEME.textMuted }}>
            <a href="https://support.tipalti.com" target="_blank" rel="noopener noreferrer" style={{ color: THEME.accentLight }}>Tipalti documentation</a> — Webhook URL for payment status: <code style={{ background: THEME.card, padding: "2px 6px", borderRadius: 4 }}>{typeof window !== "undefined" ? window.location.origin : ""}/api/webhooks/tipalti</code>
          </div>
        </div>
      </section>

      {/* Email Marketing */}
      <section style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Email Marketing</h2>
        <p style={{ color: THEME.textMuted, fontSize: 13, marginBottom: 16 }}>Sync active affiliates to Klaviyo or Mailchimp. Add KLAVIYO_API_KEY, KLAVIYO_AFFILIATE_LIST_ID, MAILCHIMP_API_KEY, MAILCHIMP_SERVER_PREFIX, MAILCHIMP_AFFILIATE_LIST_ID to .env.local or use the fields below.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: THEME.textMuted, marginBottom: 6 }}>Platform</label>
            <select value={emailMarketingPlatform} onChange={(e) => setEmailMarketingPlatform((e.target.value as EmailMarketingPlatform) || "none")} style={{ width: "100%", maxWidth: 200, padding: "10px 12px", border: `1px solid ${THEME.border}`, borderRadius: 8, fontSize: 14 }}>
              <option value="none">None</option>
              <option value="klaviyo">Klaviyo</option>
              <option value="mailchimp">Mailchimp</option>
            </select>
          </div>
          {emailMarketingPlatform === "klaviyo" && (
            <>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: THEME.textMuted, marginBottom: 6 }}>Klaviyo API Key</label>
                <input type="password" value={klaviyoApiKey} onChange={(e) => setKlaviyoApiKey(e.target.value)} placeholder="PK_..." style={{ width: "100%", maxWidth: 400, padding: "10px 12px", border: `1px solid ${THEME.border}`, borderRadius: 8, fontSize: 14 }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: THEME.textMuted, marginBottom: 6 }}>Affiliate List ID</label>
                <input type="text" value={klaviyoAffiliateListId} onChange={(e) => setKlaviyoAffiliateListId(e.target.value)} placeholder="List ID from Klaviyo" style={{ width: "100%", maxWidth: 400, padding: "10px 12px", border: `1px solid ${THEME.border}`, borderRadius: 8, fontSize: 14 }} />
              </div>
            </>
          )}
          {emailMarketingPlatform === "mailchimp" && (
            <>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: THEME.textMuted, marginBottom: 6 }}>Mailchimp API Key</label>
                <input type="password" value={mailchimpApiKey} onChange={(e) => setMailchimpApiKey(e.target.value)} placeholder="API key" style={{ width: "100%", maxWidth: 400, padding: "10px 12px", border: `1px solid ${THEME.border}`, borderRadius: 8, fontSize: 14 }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: THEME.textMuted, marginBottom: 6 }}>Server prefix</label>
                <input type="text" value={mailchimpServerPrefix} onChange={(e) => setMailchimpServerPrefix(e.target.value)} placeholder="e.g. us19" style={{ width: "100%", maxWidth: 200, padding: "10px 12px", border: `1px solid ${THEME.border}`, borderRadius: 8, fontSize: 14 }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: THEME.textMuted, marginBottom: 6 }}>Affiliate List ID</label>
                <input type="text" value={mailchimpAffiliateListId} onChange={(e) => setMailchimpAffiliateListId(e.target.value)} placeholder="List ID from Mailchimp" style={{ width: "100%", maxWidth: 400, padding: "10px 12px", border: `1px solid ${THEME.border}`, borderRadius: 8, fontSize: 14 }} />
              </div>
            </>
          )}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              type="button"
              disabled={emailMarketingPlatform === "none"}
              onClick={async () => {
                setEmailMarketingTestResult(null);
                const res = await fetch("/api/email-marketing/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ platform: emailMarketingPlatform }) });
                const data = await res.json().catch(() => ({}));
                setEmailMarketingTestResult({ ok: !!data.ok, text: data.ok ? "Connection successful" : (data.error || "Connection failed") });
              }}
              style={{ padding: "8px 16px", background: emailMarketingPlatform === "none" ? "#e2e8f0" : THEME.accentLight, color: "#fff", border: "none", borderRadius: 6, cursor: emailMarketingPlatform === "none" ? "not-allowed" : "pointer", fontSize: 13 }}
            >
              Test Connection
            </button>
            <button
              type="button"
              disabled={emailMarketingPlatform === "none" || emailMarketingSyncing}
              onClick={async () => {
                setEmailMarketingSyncResult(null);
                setEmailMarketingSyncing(true);
                try {
                  const res = await fetch("/api/email-marketing/sync", { method: "POST" });
                  const data = await res.json().catch(() => ({}));
                  setEmailMarketingSyncResult({ ok: !!data.ok, text: data.ok ? `Synced ${data.synced ?? 0} affiliates.` : (data.error || "Sync failed") });
                  if (data.ok) await refetch();
                } catch {
                  setEmailMarketingSyncResult({ ok: false, text: "Sync failed" });
                } finally {
                  setEmailMarketingSyncing(false);
                }
              }}
              style={{ padding: "8px 16px", background: emailMarketingPlatform === "none" || emailMarketingSyncing ? "#cbd5e1" : THEME.success, color: "#fff", border: "none", borderRadius: 6, cursor: emailMarketingPlatform === "none" || emailMarketingSyncing ? "not-allowed" : "pointer", fontSize: 13 }}
            >
              {emailMarketingSyncing ? "Syncing…" : "Sync All Affiliates"}
            </button>
          </div>
          {emailMarketingTestResult && (
            <div style={{ padding: 12, borderRadius: 8, background: emailMarketingTestResult.ok ? "#dcfce7" : "#fee2e2", color: emailMarketingTestResult.ok ? THEME.success : THEME.error, fontSize: 13 }}>
              {emailMarketingTestResult.text}
            </div>
          )}
          {emailMarketingSyncResult && (
            <div style={{ padding: 12, borderRadius: 8, background: emailMarketingSyncResult.ok ? "#dcfce7" : "#fee2e2", color: emailMarketingSyncResult.ok ? THEME.success : THEME.error, fontSize: 13 }}>
              {emailMarketingSyncResult.text}
            </div>
          )}
        </div>
        {/* Email Marketing status tab */}
        <div style={{ marginTop: 24, paddingTop: 24, borderTop: `1px solid ${THEME.border}` }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Status</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
            <span style={{ padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600, background: (initial.emailMarketingPlatform === "klaviyo" || initial.emailMarketingPlatform === "mailchimp") ? "#dcfce7" : "#f1f5f9", color: (initial.emailMarketingPlatform === "klaviyo" || initial.emailMarketingPlatform === "mailchimp") ? THEME.success : THEME.textMuted }}>
              {(initial.emailMarketingPlatform === "klaviyo" || initial.emailMarketingPlatform === "mailchimp") ? "Connected" : "Not connected"}
            </span>
            <span style={{ fontSize: 13, color: THEME.textMuted }}>Platform: {initial.emailMarketingPlatform === "klaviyo" ? "Klaviyo" : initial.emailMarketingPlatform === "mailchimp" ? "Mailchimp" : "None"}</span>
            <span style={{ fontSize: 13, color: THEME.textMuted }}>Affiliates synced: {initial.emailMarketingSyncedCount || "0"}</span>
            <span style={{ fontSize: 13, color: THEME.textMuted }}>Last sync: {initial.emailMarketingLastSyncAt ? new Date(initial.emailMarketingLastSyncAt).toLocaleString() : "—"}</span>
            <button
              type="button"
              disabled={initial.emailMarketingPlatform === "none" || emailMarketingSyncing}
              onClick={async () => {
                setEmailMarketingSyncResult(null);
                setEmailMarketingSyncing(true);
                try {
                  const res = await fetch("/api/email-marketing/sync", { method: "POST" });
                  const data = await res.json().catch(() => ({}));
                  setEmailMarketingSyncResult({ ok: !!data.ok, text: data.ok ? `Synced ${data.synced ?? 0} affiliates.` : (data.error || "Sync failed") });
                  await refetch();
                } catch {
                  setEmailMarketingSyncResult({ ok: false, text: "Sync failed" });
                } finally {
                  setEmailMarketingSyncing(false);
                }
              }}
              style={{ padding: "6px 12px", background: initial.emailMarketingPlatform === "none" || emailMarketingSyncing ? "#e2e8f0" : THEME.accentLight, color: "#fff", border: "none", borderRadius: 6, cursor: initial.emailMarketingPlatform === "none" || emailMarketingSyncing ? "not-allowed" : "pointer", fontSize: 12 }}
            >
              Manual sync
            </button>
          </div>
        </div>
      </section>

      {/* Weekly digest */}
      <section style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Weekly email digest</h2>
        <p style={{ color: THEME.textMuted, fontSize: 13, marginBottom: 16 }}>Every Monday at 8am a digest is sent to the admin email above with revenue vs last week, new affiliates, top performers, commissions owed, and tier upgrades.</p>
        <button
          type="button"
          disabled={digestSending}
          onClick={async () => {
            setDigestResult(null);
            setDigestSending(true);
            try {
              const res = await fetch("/api/cron/weekly-digest?test=1");
              const data = await res.json().catch(() => ({}));
              setDigestResult({ ok: res.ok && !!data.ok, text: res.ok ? "Test digest sent to admin email." : (data.error || "Failed to send") });
            } catch {
              setDigestResult({ ok: false, text: "Failed to send" });
            } finally {
              setDigestSending(false);
            }
          }}
          style={{ padding: "8px 16px", background: digestSending ? "#cbd5e1" : THEME.accentLight, color: "#fff", border: "none", borderRadius: 6, cursor: digestSending ? "not-allowed" : "pointer", fontSize: 13 }}
        >
          {digestSending ? "Sending…" : "Send test digest"}
        </button>
        {digestResult && (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: digestResult.ok ? "#dcfce7" : "#fee2e2", color: digestResult.ok ? THEME.success : THEME.error, fontSize: 13 }}>
            {digestResult.text}
          </div>
        )}
      </section>

      <button type="button" onClick={save} disabled={saving} style={{ padding: "12px 32px", background: saving ? "#cbd5e1" : THEME.accent, color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>{saving ? "Saving…" : "Save settings"}</button>
        </>
      )}

      {settingsTab === "tracking" && (
        <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>WooCommerce tracking</h2>
          <p style={{ color: THEME.textMuted, fontSize: 13, marginBottom: 20 }}>Give this page to your developer so they can install affiliate tracking on the BLL WooCommerce store. The snippet captures <code style={{ background: THEME.bg, padding: "2px 6px", borderRadius: 4 }}>?ref=</code> or <code style={{ background: THEME.bg, padding: "2px 6px", borderRadius: 4 }}>?affiliate=</code>, saves it in a cookie and localStorage, and adds it to checkout as <code style={{ background: THEME.bg, padding: "2px 6px", borderRadius: 4 }}>_bll_affiliate_ref</code> so the webhook can attribute orders.</p>

          <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 24, marginBottom: 10 }}>Step 1: Webhook URL</h3>
          <p style={{ color: THEME.textMuted, fontSize: 12, marginBottom: 8 }}>Use this URL when creating the webhook in WooCommerce.</p>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
            <code style={{ flex: 1, minWidth: 200, padding: "10px 12px", background: THEME.bg, borderRadius: 8, fontSize: 12, wordBreak: "break-all" }}>{webhookUrl}</code>
            <button type="button" onClick={() => copyToClipboard(webhookUrl, "URL")} style={{ padding: "10px 16px", background: copyFeedback === "URL" ? THEME.success : THEME.accent, color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>{copyFeedback === "URL" ? "Copied" : "Copy"}</button>
          </div>

          <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 24, marginBottom: 10 }}>Step 2: Webhook secret</h3>
          <p style={{ color: THEME.textMuted, fontSize: 12, marginBottom: 8 }}>Set the same secret in WooCommerce (Webhook → Secret) and in Vercel as <code>WOOCOMMERCE_WEBHOOK_SECRET</code>.</p>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
            <code style={{ padding: "10px 12px", background: THEME.bg, borderRadius: 8, fontSize: 12 }}>{webhookConfigured === true ? "••••••••••••" : "Not set in env"}</code>
            <button type="button" onClick={() => copyToClipboard("Set WOOCOMMERCE_WEBHOOK_SECRET in Vercel env and the same value in WooCommerce → Webhooks → [your webhook] → Secret.", "Secret")} style={{ padding: "10px 16px", background: copyFeedback === "Secret" ? THEME.success : THEME.accent, color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>{copyFeedback === "Secret" ? "Copied" : "Copy instructions"}</button>
          </div>

          <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 24, marginBottom: 10 }}>Step 3: Add webhook in WooCommerce</h3>
          <p style={{ color: THEME.textMuted, fontSize: 12, marginBottom: 8 }}>WooCommerce → Settings → Advanced → Webhooks → Add webhook. Topic: <strong>Order updated</strong>. Delivery URL: paste the URL above. Secret: same as in Vercel.</p>

          <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 24, marginBottom: 10 }}>Step 4: Install tracking on the store</h3>
          <p style={{ color: THEME.textMuted, fontSize: 12, marginBottom: 12 }}>Choose one method below.</p>

          <h4 style={{ fontSize: 14, fontWeight: 600, marginTop: 16, marginBottom: 8 }}>Option A — WordPress plugin (easier)</h4>
          <p style={{ color: THEME.textMuted, fontSize: 12, marginBottom: 8 }}>Add this to your theme&apos;s <code>functions.php</code> or use a plugin like Code Snippets:</p>
          <div style={{ position: "relative", marginBottom: 16 }}>
            <pre style={{ margin: 0, padding: 16, background: "#1e293b", color: "#e2e8f0", borderRadius: 8, fontSize: 12, overflow: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{phpSnippet}</pre>
            <button type="button" onClick={() => copyToClipboard(phpSnippet, "PHP")} style={{ position: "absolute", top: 8, right: 8, padding: "8px 12px", background: copyFeedback === "PHP" ? THEME.success : THEME.accentLight, color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>{copyFeedback === "PHP" ? "Copied" : "Copy"}</button>
          </div>

          <h4 style={{ fontSize: 14, fontWeight: 600, marginTop: 16, marginBottom: 8 }}>Option B — Manual JS</h4>
          <p style={{ color: THEME.textMuted, fontSize: 12, marginBottom: 8 }}>Load the snippet in your theme&apos;s header or via Google Tag Manager. Script URL:</p>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
            <code style={{ flex: 1, minWidth: 180, padding: "8px 10px", background: THEME.bg, borderRadius: 6, fontSize: 11, wordBreak: "break-all" }}>{snippetUrl}</code>
            <button type="button" onClick={() => copyToClipboard(snippetUrl, "JS URL")} style={{ padding: "8px 12px", background: copyFeedback === "JS URL" ? THEME.success : THEME.accent, color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>{copyFeedback === "JS URL" ? "Copied" : "Copy"}</button>
          </div>
          <p style={{ color: THEME.textMuted, fontSize: 12 }}>Or add a script tag: <code style={{ background: THEME.bg, padding: "2px 6px", borderRadius: 4 }}>{`<script src="${snippetUrl}"><\/script>`}</code></p>

          <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 28, marginBottom: 10 }}>Test tracking</h3>
          <p style={{ color: THEME.textMuted, fontSize: 12, marginBottom: 12 }}>Enter an affiliate slug (or id) to confirm they exist and would be attributed by the webhook.</p>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
            <input type="text" value={trackingTestSlug} onChange={(e) => setTrackingTestSlug(e.target.value)} placeholder="e.g. sarabeth" style={{ width: 200, padding: "8px 12px", border: `1px solid ${THEME.border}`, borderRadius: 8, fontSize: 13 }} />
            <button
              type="button"
              onClick={async () => {
                setTrackingTestResult(null);
                if (!trackingTestSlug.trim()) return;
                const res = await fetch("/api/settings/tracking-test?slug=" + encodeURIComponent(trackingTestSlug.trim()));
                const data = await res.json().catch(() => ({}));
                setTrackingTestResult({ ok: !!data.ok, text: data.ok ? (data.message || "Affiliate found.") : (data.error || "Not found") });
              }}
              style={{ padding: "8px 16px", background: THEME.accentLight, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13 }}
            >
              Verify
            </button>
          </div>
          {trackingTestResult && (
            <div style={{ padding: 12, borderRadius: 8, background: trackingTestResult.ok ? "#dcfce7" : "#fee2e2", color: trackingTestResult.ok ? THEME.success : THEME.error, fontSize: 13 }}>
              {trackingTestResult.text}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 48, paddingTop: 24, borderTop: `1px solid ${THEME.border}` }}>
        {!dangerZoneOpen ? (
          <button type="button" onClick={() => setDangerZoneOpen(true)} style={{ background: "none", border: "none", color: THEME.textMuted, fontSize: 12, cursor: "pointer", padding: 0 }}>Show Danger Zone</button>
        ) : (
          <div style={{ border: "2px solid #dc2626", borderRadius: 12, padding: 20, background: "#fef2f2" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#b91c1c", marginBottom: 12 }}>Danger Zone</h3>
            <p style={{ fontSize: 12, color: "#991b1b", marginBottom: 16 }}>These actions are irreversible and will permanently destroy data.</p>
            <button type="button" onClick={() => setDeleteAllStep(1)} disabled={deleteAllProgress} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: deleteAllProgress ? "not-allowed" : "pointer" }}>
              <span aria-hidden>⚠️</span> Delete All Affiliates
            </button>
          </div>
        )}
      </div>

      {deleteAllStep !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => { if (deleteAllStep === 3 && deleteAllCountdown !== null) return; if (deleteAllCountdownRef.current) clearInterval(deleteAllCountdownRef.current); setDeleteAllStep(null); setDeleteAllConfirmText(""); setDeleteAllCountdown(null); }}>
          <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 16, padding: 24, maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            {deleteAllStep === 1 && (
              <>
                <h3 style={{ marginBottom: 12, fontSize: 18, fontWeight: 700, color: THEME.text }}>WARNING</h3>
                <p style={{ color: THEME.textMuted, fontSize: 14, marginBottom: 20 }}>This will permanently delete ALL affiliates and ALL associated data (clicks, conversions, payouts, slug history, fraud flags, generated links — everything). This is intended for clearing test data before going live. This CANNOT be undone.</p>
                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                  <button type="button" onClick={() => setDeleteAllStep(null)} style={{ padding: "10px 18px", background: THEME.bg, border: `1px solid ${THEME.border}`, borderRadius: 8, cursor: "pointer" }}>Cancel</button>
                  <button type="button" onClick={() => setDeleteAllStep(2)} style={{ padding: "10px 18px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Continue</button>
                </div>
              </>
            )}
            {deleteAllStep === 2 && (
              <>
                <h3 style={{ marginBottom: 12, fontSize: 18, fontWeight: 700, color: THEME.text }}>Type to confirm</h3>
                <p style={{ color: THEME.textMuted, fontSize: 14, marginBottom: 8 }}>Type <strong>DELETE ALL AFFILIATES</strong> exactly.</p>
                <input type="text" value={deleteAllConfirmText} onChange={e => setDeleteAllConfirmText(e.target.value)} placeholder="DELETE ALL AFFILIATES" style={{ width: "100%", padding: "10px 12px", border: `1px solid ${THEME.border}`, borderRadius: 8, marginBottom: 16, fontSize: 14 }} />
                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                  <button type="button" onClick={() => { setDeleteAllStep(null); setDeleteAllConfirmText(""); }} style={{ padding: "10px 18px", background: THEME.bg, border: `1px solid ${THEME.border}`, borderRadius: 8, cursor: "pointer" }}>Cancel</button>
                  <button type="button" disabled={deleteAllConfirmText !== "DELETE ALL AFFILIATES"} onClick={() => { setDeleteAllStep(3); setDeleteAllCountdown(5); }} style={{ padding: "10px 18px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Continue</button>
                </div>
              </>
            )}
            {deleteAllStep === 3 && (
              <>
                <h3 style={{ marginBottom: 12, fontSize: 18, fontWeight: 700, color: THEME.text }}>Deleting in {deleteAllCountdown ?? 0}...</h3>
                <p style={{ color: THEME.textMuted, fontSize: 14, marginBottom: 20 }}>Click Cancel to abort.</p>
                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                  <button type="button" onClick={() => { if (deleteAllCountdownRef.current) clearInterval(deleteAllCountdownRef.current); setDeleteAllStep(null); setDeleteAllCountdown(null); }} style={{ padding: "10px 18px", background: THEME.bg, border: `1px solid ${THEME.border}`, borderRadius: 8, cursor: "pointer" }}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
