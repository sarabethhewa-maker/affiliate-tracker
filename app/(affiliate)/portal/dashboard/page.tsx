"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { setOnboardingCopiedLink } from "../OnboardingChecklist";
import { parseHistoricalStats } from "@/lib/parseHistoricalStats";

const THEME = {
  bg: "var(--theme-bg)",
  card: "var(--theme-card)",
  border: "var(--theme-border)",
  text: "var(--theme-text)",
  textMuted: "var(--theme-text-muted)",
  accent: "var(--theme-accent)",
  accentLight: "var(--theme-accent-light)",
  success: "var(--theme-success)",
  successBg: "var(--theme-success-bg)",
  warning: "var(--theme-warning)",
  warningBg: "var(--theme-warning-bg)",
};

type TierRow = { name: string; commission: number; threshold: number };
type MeResponse = {
  pending?: boolean;
  noApplication?: boolean;
  affiliate?: {
    id: string;
    name: string;
    email: string;
    slug?: string | null;
    tier: string;
    notes?: string | null;
    status: string;
    referralCode: string | null;
    tipaltiStatus: string | null;
    clicks: number;
    conversions: Array<{
      id: string;
      amount: number;
      status: string;
      product: string | null;
      createdAt: string;
    }>;
    payouts: Array<{
      id: string;
      amount: number;
      method: string;
      paidAt: string;
      payoutStatus: string | null;
    }>;
    children: Array<{
      id: string;
      name: string;
      email: string;
      tier: string;
      status: string;
      clicksCount: number;
      conversionsCount: number;
      totalSales: number;
    }>;
  };
  tiers?: TierRow[];
  programName?: string;
  websiteUrl?: string;
  tierIndex?: number;
  commissionRate?: number;
  monthlyRevenue?: number;
  nextTierThreshold?: number | null;
  progress?: number;
  totalClicks?: number;
  totalSales?: number;
  totalEarned?: number;
  pendingPayout?: number;
};

function getTierIndexForRevenue(monthlyRevenue: number, tiers: TierRow[]): number {
  let index = 0;
  for (let i = 0; i < tiers.length; i++) {
    if (monthlyRevenue >= tiers[i].threshold) index = i;
  }
  return index;
}

function copyToClipboard(text: string, setCopied: (v: boolean) => void) {
  navigator.clipboard.writeText(text).then(() => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  });
}

/* parseHistoricalStats imported from @/lib/parseHistoricalStats */

export default function PortalDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const previewId = searchParams.get("preview");
  const [data, setData] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedTrack, setCopiedTrack] = useState(false);
  const [copiedRecruit, setCopiedRecruit] = useState(false);
  const [calculatorRevenue, setCalculatorRevenue] = useState(500);
  const [announcements, setAnnouncements] = useState<{ id: string; title: string; content: string; priority: string; pinned: boolean; publishedAt: string; expiresAt: string | null; likedByAffiliateIds?: string[] | null; comments?: unknown[] | null }[]>([]);
  const [likingId, setLikingId] = useState<string | null>(null);

  const fetchMe = useCallback(async () => {
    const url = previewId
      ? `/api/me/affiliate?preview=${encodeURIComponent(previewId)}`
      : "/api/me/affiliate";
    const res = await fetch(url);
    const text = await res.text();
    try {
      const json = text ? (JSON.parse(text) as MeResponse) : {};
      setData(json);
    } catch {
      setData({});
    } finally {
      setLoading(false);
    }
  }, [previewId]);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const fetchAnnouncements = useCallback(async () => {
    const r = await fetch("/api/announcements");
    if (r.ok) {
      const list = await r.json();
      setAnnouncements(Array.isArray(list) ? list : []);
    }
  }, []);

  useEffect(() => {
    if (!data?.affiliate) return;
    fetchAnnouncements().catch(() => setAnnouncements([]));
  }, [data?.affiliate, fetchAnnouncements]);

  const toggleAnnouncementLike = async (announcementId: string) => {
    if (likingId) return;
    setLikingId(announcementId);
    try {
      const r = await fetch(`/api/announcements/${announcementId}/like`, { method: "POST" });
      if (r.ok) fetchAnnouncements();
    } finally {
      setLikingId(null);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === "#your-links") {
      const el = document.getElementById("your-links");
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [data]);

  useEffect(() => {
    if (loading || !data) return;
    if (
      data.pending === true ||
      data.noApplication === true ||
      !data.affiliate ||
      data.affiliate.status !== "active"
    ) {
      router.replace("/portal");
      return;
    }
  }, [data, loading, router]);

  if (loading) {
    return (
      <div style={{ padding: 48, color: THEME.textMuted }}>
        Loading…
      </div>
    );
  }

  if (
    !data ||
    data.pending === true ||
    data.noApplication === true ||
    !data.affiliate ||
    data.affiliate.status !== "active"
  ) {
    return null;
  }

  const aff = data.affiliate;
  const tiers = data.tiers ?? [];

  // Compute tier from total revenue (live conversions + historical from notes)
  const liveRevenue = aff.conversions.reduce((s, c) => s + c.amount, 0);
  const histStats = parseHistoricalStats(aff.notes ?? null);
  const historicalRevenue = histStats?.revenue ?? 0;
  const totalRevenue = liveRevenue + historicalRevenue;
  const tierIndex = getTierIndexForRevenue(totalRevenue, tiers);
  const tierName = tiers[tierIndex]?.name ?? "Affiliate";
  const commissionRate = tiers[tierIndex]?.commission ?? 10;
  const isTopTier = tierIndex >= tiers.length - 1;
  const nextTier = isTopTier ? null : tiers[tierIndex + 1];
  const nextTierThreshold = nextTier?.threshold ?? null;
  const tierProgress = nextTierThreshold != null && nextTierThreshold > 0
    ? Math.min(1, totalRevenue / nextTierThreshold)
    : 1;
  const remaining = nextTierThreshold != null ? Math.max(0, nextTierThreshold - totalRevenue) : 0;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const trackingLink = aff.slug ? `${origin}/ref/${aff.slug}` : `${origin}/api/ref/${aff.id}`;
  const recruitLink = aff.referralCode ? `${origin}/join?ref=${aff.referralCode}` : null;
  const needsTipalti =
    aff.tipaltiStatus !== "active" && aff.tipaltiStatus !== "pending";

  const calculatorTierIndex = getTierIndexForRevenue(calculatorRevenue, tiers);
  const calculatorRate = tiers[calculatorTierIndex]?.commission ?? 10;
  const calculatorCommission = (calculatorRevenue * calculatorRate) / 100;

  const tierNames: Record<string, string> = {};
  tiers.forEach((t, i) => {
    tierNames[String(i)] = t.name;
  });

  const now = new Date();
  const isExpired = (a: { expiresAt: string | null }) => a.expiresAt != null && new Date(a.expiresAt) <= now;
  const displayedAnnouncements = announcements.slice(0, 5);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: THEME.text }}>
        Dashboard
      </h1>

      {/* Announcements */}
      <div
        style={{
          background: "#f5f0ff",
          border: "1px solid #e9e0f7",
          borderLeft: "4px solid #7c3aed",
          borderRadius: 12,
          padding: 20,
          boxShadow: "0 2px 8px rgba(124, 58, 237, 0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 18 }}>📢</span>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#6d28d9", margin: 0 }}>
            Announcements
          </h2>
          {announcements.length > 0 && (
            <span style={{ background: "#7c3aed", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10 }}>
              {announcements.length}
            </span>
          )}
        </div>
        {displayedAnnouncements.length === 0 ? (
          <p style={{ color: THEME.textMuted, fontSize: 14, margin: 0 }}>No announcements yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {displayedAnnouncements.map((a) => {
              const expired = isExpired(a);
              const borderColor = expired ? "#94a3b8" : a.priority === "urgent" ? "#b91c1c" : a.priority === "important" ? "#b45309" : "#e2e8f0";
              const contentPreview = a.content.length > 150 ? a.content.slice(0, 150) + "…" : a.content;
              return (
                <div
                  key={a.id}
                  style={{
                    background: THEME.bg,
                    border: `1px solid ${THEME.border}`,
                    borderLeft: `4px solid ${borderColor}`,
                    borderRadius: 10,
                    padding: 16,
                    opacity: expired ? 0.6 : 1,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: THEME.text }}>{a.title}</span>
                    {a.pinned && <span style={{ fontSize: 12 }} title="Pinned">📌</span>}
                    {expired ? (
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 6px", borderRadius: 4, background: "#e2e8f0", color: "#64748b" }}>Expired</span>
                    ) : a.priority !== "normal" ? (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "2px 6px",
                          borderRadius: 4,
                          background: a.priority === "urgent" ? "#fee2e2" : "#fef3c7",
                          color: a.priority === "urgent" ? "#b91c1c" : "#b45309",
                        }}
                      >
                        {a.priority === "urgent" ? "Urgent" : "Important"}
                      </span>
                    ) : null}
                  </div>
                  <p style={{ color: THEME.textMuted, fontSize: 14, margin: "0 0 8px 0", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{contentPreview}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "#e9e0f7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: "#6d28d9" }}>
                      {"authorImageUrl" in a && a.authorImageUrl ? (
                        <img src={a.authorImageUrl as string} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span>{("authorName" in a && a.authorName ? String(a.authorName) : "A").charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <span style={{ fontSize: 12, color: THEME.textMuted }}>
                      Posted by {"authorName" in a && a.authorName ? String(a.authorName) : "Admin"}
                      {" · "}
                      {new Date(a.publishedAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <button
                      type="button"
                      onClick={() => toggleAnnouncementLike(a.id)}
                      disabled={likingId === a.id}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: likingId === a.id ? "wait" : "pointer",
                        padding: "2px 0",
                        fontSize: 13,
                        color: (Array.isArray(a.likedByAffiliateIds) && aff.id && a.likedByAffiliateIds.includes(aff.id)) ? "#b91c1c" : THEME.textMuted,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span>{(Array.isArray(a.likedByAffiliateIds) && aff.id && a.likedByAffiliateIds.includes(aff.id)) ? "❤️" : "🤍"}</span>
                      <span>{Array.isArray(a.likedByAffiliateIds) ? a.likedByAffiliateIds.length : 0}</span>
                    </button>
                    {Array.isArray(a.comments) && a.comments.length > 0 && (
                      <span style={{ marginLeft: 12, fontSize: 12, color: THEME.textMuted }}>{a.comments.length} comment{a.comments.length !== 1 ? "s" : ""}</span>
                    )}
                    <Link href="/portal/announcements" style={{ marginLeft: 12, fontSize: 12, color: THEME.accent, fontWeight: 600 }}>Comment →</Link>
                  </div>
                </div>
              );
            })}
            {announcements.length > 0 && (
              <Link href="/portal/announcements" style={{ fontSize: 13, color: THEME.accent, fontWeight: 600, textDecoration: "none" }}>View all announcements →</Link>
            )}
          </div>
        )}
      </div>

      {/* Welcome card */}
      <div
        style={{
          background: THEME.card,
          border: `1px solid ${THEME.border}`,
          borderRadius: 12,
          padding: 24,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: THEME.text }}>
          Welcome back, {aff.name}
        </h2>
        <p style={{ color: THEME.textMuted, fontSize: 14, margin: 0 }}>
          You’re on the <strong style={{ color: THEME.accent }}>{tierName}</strong> tier
          at {commissionRate}% commission. Share your links and grow your team to earn more.
        </p>
      </div>

      {/* Tracking & recruit links with copy */}
      <div
        id="your-links"
        style={{
          background: THEME.card,
          border: `1px solid ${THEME.border}`,
          borderRadius: 12,
          padding: 24,
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: THEME.text }}>
          Your links
        </h2>
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: THEME.textMuted, marginBottom: 8 }}>
            Tracking link
          </p>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <code
              style={{
                flex: 1,
                minWidth: 200,
                padding: "10px 12px",
                background: THEME.bg,
                borderRadius: 8,
                fontSize: 13,
                wordBreak: "break-all",
              }}
            >
              {trackingLink}
            </code>
            <button
              type="button"
              onClick={() => {
                copyToClipboard(trackingLink, setCopiedTrack);
                setOnboardingCopiedLink();
              }}
              style={{
                padding: "10px 16px",
                background: copiedTrack ? THEME.success : THEME.accent,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              {copiedTrack ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
        {recruitLink && (
          <div>
            <p style={{ fontSize: 13, color: THEME.textMuted, marginBottom: 8 }}>
              Recruit link
            </p>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <code
                style={{
                  flex: 1,
                  minWidth: 200,
                  padding: "10px 12px",
                  background: THEME.bg,
                  borderRadius: 8,
                  fontSize: 13,
                  wordBreak: "break-all",
                }}
              >
                {recruitLink}
              </code>
              <button
                type="button"
                onClick={() => copyToClipboard(recruitLink, setCopiedRecruit)}
                style={{
                  padding: "10px 16px",
                  background: copiedRecruit ? THEME.success : THEME.accent,
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                {copiedRecruit ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        )}
        <p style={{ marginTop: 12, fontSize: 12, color: THEME.textMuted }}>
          <Link href="/portal/links" style={{ color: THEME.accent, fontWeight: 600 }}>
            My Links →
          </Link>{" "}
          for QR code and shareable assets.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
        <div
          style={{
            background: THEME.card,
            border: `1px solid ${THEME.border}`,
            borderRadius: 12,
            padding: 20,
          }}
        >
          <p style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 4 }}>Total clicks</p>
          <p style={{ fontSize: 24, fontWeight: 800, color: THEME.text, margin: 0 }}>
            {data.totalClicks ?? aff.clicks ?? 0}
          </p>
        </div>
        <div
          style={{
            background: THEME.card,
            border: `1px solid ${THEME.border}`,
            borderRadius: 12,
            padding: 20,
          }}
        >
          <p style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 4 }}>Total sales</p>
          <p style={{ fontSize: 24, fontWeight: 800, color: THEME.text, margin: 0 }}>
            ${(data.totalSales ?? 0).toFixed(2)}
          </p>
        </div>
        <div
          style={{
            background: THEME.card,
            border: `1px solid ${THEME.border}`,
            borderRadius: 12,
            padding: 20,
          }}
        >
          <p style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 4 }}>Total earned</p>
          <p style={{ fontSize: 24, fontWeight: 800, color: THEME.success, margin: 0 }}>
            ${(data.totalEarned ?? 0).toFixed(2)}
          </p>
          <Link href="/portal/earnings" style={{ fontSize: 12, color: THEME.accent, fontWeight: 600 }}>
            View earnings →
          </Link>
        </div>
        <div
          style={{
            background: THEME.card,
            border: `1px solid ${THEME.border}`,
            borderRadius: 12,
            padding: 20,
          }}
        >
          <p style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 4 }}>Pending payout</p>
          <p style={{ fontSize: 24, fontWeight: 800, color: THEME.success, margin: 0 }}>
            ${(data.pendingPayout ?? 0).toFixed(2)}
          </p>
          <Link href="/portal/payouts" style={{ fontSize: 12, color: THEME.accent, fontWeight: 600 }}>
            Payouts →
          </Link>
        </div>
      </div>

      {/* Tier Progress Bar */}
      {isTopTier ? (
        <div
          style={{
            background: "linear-gradient(135deg, #fef9c3 0%, #fde68a 40%, #fbbf24 100%)",
            border: "2px solid #eab308",
            borderRadius: 16,
            padding: 28,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, background: "radial-gradient(ellipse at 80% 20%, rgba(251,191,36,0.3) 0%, transparent 60%)", pointerEvents: "none" }} />
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 32 }}>🏆</span>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#78350f", margin: 0 }}>
                  You&apos;ve reached the top tier!
                </h2>
                <p style={{ fontSize: 14, color: "#92400e", margin: "4px 0 0 0" }}>
                  You&apos;re a <strong>{tierName}</strong> affiliate earning <strong>{commissionRate}%</strong> commission
                </p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
              <div style={{ background: "rgba(120,53,15,0.1)", borderRadius: 10, padding: "10px 16px" }}>
                <span style={{ fontSize: 12, color: "#92400e" }}>Total revenue</span>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#78350f" }}>${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              </div>
              <div style={{ background: "rgba(120,53,15,0.1)", borderRadius: 10, padding: "10px 16px" }}>
                <span style={{ fontSize: 12, color: "#92400e" }}>Commission rate</span>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#78350f" }}>{commissionRate}%</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            background: THEME.card,
            border: "1px solid #e9e0f7",
            borderRadius: 16,
            padding: 28,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", top: 0, right: 0, width: 200, height: 200, background: "radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "relative" }}>
            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, color: "#fff", fontWeight: 800,
                }}>
                  {tierName.charAt(0)}
                </div>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: THEME.text, margin: 0 }}>
                    {tierName} Tier
                  </h2>
                  <span style={{ fontSize: 13, color: "#7c3aed", fontWeight: 600 }}>
                    {commissionRate}% commission
                  </span>
                </div>
              </div>
              {nextTier && (
                <div style={{
                  background: "linear-gradient(135deg, #f5f0ff 0%, #ede9fe 100%)",
                  border: "1px solid #e9e0f7",
                  borderRadius: 10, padding: "8px 14px",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 11, color: "#6d28d9", fontWeight: 600, marginBottom: 2 }}>Next: {nextTier.name}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#7c3aed" }}>Unlock {nextTier.commission}%</div>
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: THEME.text }}>
                  ${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} earned
                </span>
                {nextTierThreshold != null && (
                  <span style={{ fontSize: 12, color: THEME.textMuted }}>
                    ${nextTierThreshold.toLocaleString()} goal
                  </span>
                )}
              </div>
              <div style={{
                height: 16,
                background: "#f1ecfb",
                borderRadius: 10,
                overflow: "hidden",
                position: "relative",
                boxShadow: "inset 0 1px 3px rgba(124,58,237,0.1)",
              }}>
                <div style={{
                  width: `${Math.min(100, tierProgress * 100)}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #7c3aed 0%, #a78bfa 60%, #c4b5fd 100%)",
                  borderRadius: 10,
                  transition: "width 0.6s ease",
                  position: "relative",
                  minWidth: tierProgress > 0 ? 24 : 0,
                }} />
                {tierProgress > 0.05 && (
                  <span style={{
                    position: "absolute",
                    left: `${Math.min(95, Math.max(2, tierProgress * 100 - 4))}%`,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 10,
                    fontWeight: 800,
                    color: tierProgress > 0.15 ? "#fff" : "#7c3aed",
                    pointerEvents: "none",
                    textShadow: tierProgress > 0.15 ? "0 1px 2px rgba(0,0,0,0.2)" : "none",
                  }}>
                    {Math.round(tierProgress * 100)}%
                  </span>
                )}
              </div>
            </div>

            {/* Remaining message */}
            {nextTier && (
              <p style={{ fontSize: 14, color: THEME.textMuted, margin: 0, lineHeight: 1.5 }}>
                You need <strong style={{ color: "#7c3aed" }}>${remaining.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong> more
                revenue to reach <strong style={{ color: "#7c3aed" }}>{nextTier.name}</strong> tier
              </p>
            )}
          </div>
        </div>
      )}

      {/* Commission calculator */}
      <div
        style={{
          background: THEME.card,
          border: `1px solid ${THEME.border}`,
          borderRadius: 12,
          padding: 24,
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: THEME.text }}>
          Commission calculator
        </h2>
        <p style={{ fontSize: 14, color: THEME.textMuted, marginBottom: 16 }}>
          Estimate commission by monthly sales amount (tier is based on monthly revenue).
        </p>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 13, color: THEME.textMuted }}>
            Monthly sales: ${calculatorRevenue.toLocaleString()}
          </label>
          <input
            type="range"
            min={0}
            max={15000}
            step={100}
            value={calculatorRevenue}
            onChange={(e) => setCalculatorRevenue(Number(e.target.value))}
            style={{ width: "100%", marginTop: 8 }}
          />
        </div>
        <p style={{ fontSize: 14, color: THEME.text, margin: 0 }}>
          Tier: <strong>{tiers[calculatorTierIndex]?.name ?? "—"}</strong> ({calculatorRate}%
          ) → Commission:{" "}
          <strong style={{ color: THEME.success }}>${calculatorCommission.toFixed(2)}</strong>
        </p>
      </div>

      {/* Tipalti CTA */}
      {needsTipalti && (
        <div
          style={{
            background: THEME.warningBg,
            border: `1px solid ${THEME.warning}`,
            borderRadius: 12,
            padding: 24,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: THEME.text }}>
            Set up your payout method
          </h2>
          <p style={{ color: THEME.textMuted, fontSize: 14, marginBottom: 16 }}>
            Complete your payment profile to receive payouts.
          </p>
          <Link
            href="/portal/payouts"
            style={{
              display: "inline-block",
              padding: "10px 20px",
              background: THEME.warning,
              color: THEME.text,
              borderRadius: 8,
              fontWeight: 600,
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            Complete setup →
          </Link>
        </div>
      )}

      {/* Recent conversions */}
      <div
        style={{
          background: THEME.card,
          border: `1px solid ${THEME.border}`,
          borderRadius: 12,
          padding: 24,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: THEME.text, margin: 0 }}>
            Recent conversions
          </h2>
          <Link href="/portal/earnings" style={{ fontSize: 13, color: THEME.accent, fontWeight: 600 }}>
            View all →
          </Link>
        </div>
        {aff.conversions.length === 0 ? (
          <p style={{ color: THEME.textMuted, fontSize: 14 }}>No conversions yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${THEME.border}` }}>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: THEME.textMuted, fontWeight: 600 }}>
                    Date
                  </th>
                  <th style={{ textAlign: "right", padding: "10px 12px", color: THEME.textMuted, fontWeight: 600 }}>
                    Amount
                  </th>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: THEME.textMuted, fontWeight: 600 }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {aff.conversions.slice(0, 10).map((c) => (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${THEME.border}` }}>
                    <td style={{ padding: "10px 12px", color: THEME.text }}>
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: THEME.text }}>
                      ${c.amount.toFixed(2)}
                    </td>
                    <td style={{ padding: "10px 12px", color: THEME.textMuted, textTransform: "capitalize" }}>
                      {c.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* My team */}
      <div
        style={{
          background: THEME.card,
          border: `1px solid ${THEME.border}`,
          borderRadius: 12,
          padding: 24,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: THEME.text, margin: 0 }}>
            My team
          </h2>
          <Link href="/portal/team" style={{ fontSize: 13, color: THEME.accent, fontWeight: 600 }}>
            View all →
          </Link>
        </div>
        {aff.children.length === 0 ? (
          <p style={{ color: THEME.textMuted, fontSize: 14 }}>No recruits yet. Share your recruit link to grow your team.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${THEME.border}` }}>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: THEME.textMuted, fontWeight: 600 }}>
                    Name
                  </th>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: THEME.textMuted, fontWeight: 600 }}>
                    Tier
                  </th>
                  <th style={{ textAlign: "right", padding: "10px 12px", color: THEME.textMuted, fontWeight: 600 }}>
                    Clicks
                  </th>
                  <th style={{ textAlign: "right", padding: "10px 12px", color: THEME.textMuted, fontWeight: 600 }}>
                    Sales
                  </th>
                </tr>
              </thead>
              <tbody>
                {aff.children.slice(0, 5).map((c) => (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${THEME.border}` }}>
                    <td style={{ padding: "10px 12px", color: THEME.text }}>{c.name}</td>
                    <td style={{ padding: "10px 12px", color: THEME.text }}>
                      {tierNames[c.tier] ?? c.tier}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: THEME.text }}>
                      {c.clicksCount}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: THEME.text }}>
                      ${c.totalSales.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payout history */}
      <div
        style={{
          background: THEME.card,
          border: `1px solid ${THEME.border}`,
          borderRadius: 12,
          padding: 24,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: THEME.text, margin: 0 }}>
            Payout history
          </h2>
          <Link href="/portal/payouts" style={{ fontSize: 13, color: THEME.accent, fontWeight: 600 }}>
            View all →
          </Link>
        </div>
        {aff.payouts.length === 0 ? (
          <p style={{ color: THEME.textMuted, fontSize: 14 }}>No payouts yet.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {aff.payouts.slice(0, 5).map((p) => (
              <li
                key={p.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 0",
                  borderBottom: `1px solid ${THEME.border}`,
                }}
              >
                <div>
                  <span style={{ color: THEME.text }}>{new Date(p.paidAt).toLocaleDateString()}</span>
                  <span style={{ marginLeft: 12, color: THEME.textMuted, fontSize: 13, textTransform: "capitalize" }}>
                    {p.method.replace(/_/g, " ")}
                  </span>
                </div>
                <span style={{ fontWeight: 700, color: THEME.success }}>${p.amount.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
