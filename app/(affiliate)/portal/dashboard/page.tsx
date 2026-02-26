"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { setOnboardingCopiedLink } from "../OnboardingChecklist";

const THEME = {
  bg: "#f8fafc",
  card: "#ffffff",
  border: "#e2e8f0",
  text: "#1a1a1a",
  textMuted: "#4a5568",
  accent: "#1e3a5f",
  accentLight: "#3a7ca5",
  success: "#0d7a3d",
  successBg: "#dcfce7",
  warning: "#b45309",
  warningBg: "#fef3c7",
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

export default function PortalDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const previewId = searchParams.get("preview");
  const [data, setData] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedTrack, setCopiedTrack] = useState(false);
  const [copiedRecruit, setCopiedRecruit] = useState(false);
  const [calculatorRevenue, setCalculatorRevenue] = useState(500);

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
  const tierIndex = data.tierIndex ?? 0;
  const tierName = tiers[tierIndex]?.name ?? "Affiliate";
  const commissionRate = data.commissionRate ?? 10;
  const progress = data.progress ?? 0;
  const nextTier = tiers[tierIndex + 1];
  const nextTierThreshold = data.nextTierThreshold ?? nextTier?.threshold ?? null;
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: THEME.text }}>
        Dashboard
      </h1>

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

      {/* Tier / leaderboard progress */}
      <div
        style={{
          background: THEME.card,
          border: `1px solid ${THEME.border}`,
          borderRadius: 12,
          padding: 24,
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: THEME.text }}>
          Tier progress
        </h2>
        <p style={{ fontSize: 14, color: THEME.textMuted, marginBottom: 12 }}>
          Current tier: <strong style={{ color: THEME.text }}>{tierName}</strong> ({commissionRate}%
          commission). Monthly sales this period: ${(data.monthlyRevenue ?? 0).toFixed(2)}.
        </p>
        {nextTierThreshold != null ? (
          <>
            <div
              style={{
                height: 10,
                background: THEME.bg,
                borderRadius: 5,
                overflow: "hidden",
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, progress * 100)}%`,
                  height: "100%",
                  background: THEME.accent,
                  borderRadius: 5,
                  transition: "width 0.3s ease",
                }}
              />
            </div>
            <p style={{ fontSize: 12, color: THEME.textMuted, margin: 0 }}>
              {Math.round(progress * 100)}% to {tiers[tierIndex + 1]?.name ?? "next tier"} ($
              {nextTierThreshold.toLocaleString()} threshold)
            </p>
          </>
        ) : (
          <p style={{ fontSize: 13, color: THEME.success, fontWeight: 600 }}>
            You’re at the top tier.
          </p>
        )}
      </div>

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
          <a
            href="/api/me/tipalti-onboarding"
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
          </a>
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
