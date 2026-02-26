"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { setOnboardingCopiedLink } from "./OnboardingChecklist";

const THEME = {
  bg: "#0f172a",
  card: "#1e293b",
  border: "#334155",
  text: "#f1f5f9",
  textMuted: "#94a3b8",
  accent: "#38bdf8",
  success: "#4ade80",
  successBg: "#14532d",
  warning: "#fbbf24",
  warningBg: "#422006",
};

type MeResponse = {
  pending?: boolean;
  message?: string;
  affiliate?: {
    id: string;
    name: string;
    email: string;
    tier: string;
    status: string;
    referralCode: string | null;
    tipaltiStatus: string | null;
    clicks: number;
    conversions: { id: string; amount: number; status: string; product: string | null; createdAt: string; paidAt: string | null }[];
    payouts: { id: string; amount: number; method: string; paidAt: string; payoutStatus: string | null }[];
    children: { id: string; name: string; email: string; tier: string; status: string; clicksCount: number; conversionsCount: number; totalSales: number }[];
  };
  tiers?: { name: string; commission: number; threshold: number; mlm2?: number }[];
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

function copyToClipboard(text: string, setCopied: (v: boolean) => void) {
  navigator.clipboard.writeText(text).then(() => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  });
}

function getTierIndexForRevenue(monthlyRevenue: number, tiers: { threshold: number }[]): number {
  let index = 0;
  for (let i = 0; i < tiers.length; i++) {
    if (monthlyRevenue >= tiers[i].threshold) index = i;
  }
  return index;
}

export default function PortalDashboardPage() {
  const searchParams = useSearchParams();
  const previewId = searchParams.get("preview");
  const [data, setData] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedTrack, setCopiedTrack] = useState(false);
  const [copiedRecruit, setCopiedRecruit] = useState(false);
  const [leaderboard, setLeaderboard] = useState<{ top10: { rank: number; name: string; tierLabel: string; salesThisMonth: number; totalSales: number; recruitsCount: number }[]; myRank: { rank: number; name: string; tierLabel: string; salesThisMonth: number; totalSales: number; recruitsCount: number } | null; mode: string } | null>(null);
  const [calcSales, setCalcSales] = useState(5000);
  const [calcShareCopied, setCalcShareCopied] = useState(false);

  const fetchMe = useCallback(async () => {
    const url = previewId ? `/api/me/affiliate?preview=${encodeURIComponent(previewId)}` : "/api/me/affiliate";
    const res = await fetch(url);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [previewId]);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (!data?.affiliate) return;
    const mode = "month";
    fetch(`/api/leaderboard?mode=${mode}`)
      .then((r) => r.ok ? r.json() : null)
      .then((j) => j && setLeaderboard(j));
  }, [data?.affiliate]);

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: THEME.textMuted }}>
        Loading…
      </div>
    );
  }

  if (data?.pending || !data?.affiliate) {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", padding: 48, textAlign: "center" }}>
        <div style={{ background: THEME.warningBg, border: `1px solid ${THEME.warning}`, borderRadius: 12, padding: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: THEME.text, marginBottom: 12 }}>Account pending</h1>
          <p style={{ color: THEME.textMuted, fontSize: 15 }}>{data?.message ?? "Your account is pending approval. Once an admin approves your application, you’ll see your dashboard here."}</p>
        </div>
      </div>
    );
  }

  const aff = data.affiliate;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const trackingLink = `${origin}/api/ref/${aff.id}`;
  const recruitLink = aff.referralCode ? `${origin}/join?ref=${aff.referralCode}` : null;
  const tierName = data.tiers?.[data.tierIndex ?? 0]?.name ?? "Affiliate";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Welcome + tier */}
      <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: THEME.text, marginBottom: 4 }}>Welcome, {aff.name}</h1>
            <span style={{ background: "#334155", color: THEME.accent, padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>
              {tierName}
            </span>
          </div>
          {previewId && (
            <span style={{ fontSize: 12, color: THEME.warning }}>Viewing as affiliate (preview)</span>
          )}
        </div>
      </div>

      {/* Links with copy */}
      <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: THEME.text }}>Your links</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, color: THEME.textMuted, marginBottom: 4 }}>Tracking link (for customers)</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <code style={{ flex: 1, minWidth: 200, padding: "10px 12px", background: THEME.bg, borderRadius: 8, fontSize: 13, wordBreak: "break-all" }}>{trackingLink}</code>
              <button
                type="button"
                onClick={() => { copyToClipboard(trackingLink, setCopiedTrack); setOnboardingCopiedLink(); }}
                style={{ padding: "10px 16px", background: copiedTrack ? THEME.success : THEME.accent, color: "#0f172a", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}
              >
                {copiedTrack ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
          {recruitLink && (
            <div>
              <label style={{ display: "block", fontSize: 11, color: THEME.textMuted, marginBottom: 4 }}>Recruit link (for new affiliates)</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <code style={{ flex: 1, minWidth: 200, padding: "10px 12px", background: THEME.bg, borderRadius: 8, fontSize: 13, wordBreak: "break-all" }}>{recruitLink}</code>
                <button
                  type="button"
                  onClick={() => copyToClipboard(recruitLink, setCopiedRecruit)}
                  style={{ padding: "10px 16px", background: copiedRecruit ? THEME.success : THEME.accent, color: "#0f172a", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}
                >
                  {copiedRecruit ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard */}
      {leaderboard && (
        <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: THEME.text }}>🏆 Leaderboard — This month</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {leaderboard.top10.map((r, i) => {
              const isTop3 = i < 3;
              const medals = ["🥇", "🥈", "🥉"];
              return (
                <div
                  key={r.rank}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: isTop3 ? 14 : 10,
                    background: isTop3 ? (i === 0 ? "rgba(251,191,36,0.12)" : i === 1 ? "rgba(148,163,184,0.12)" : "rgba(251,146,60,0.12)") : THEME.bg,
                    border: `1px solid ${isTop3 ? (i === 0 ? "#fbbf24" : i === 1 ? "#94a3b8" : "#fb923c") : THEME.border}`,
                    borderRadius: 8,
                  }}
                >
                  <span style={{ width: 28, fontSize: 14, fontWeight: 800, color: THEME.textMuted }}>{isTop3 ? medals[i] : `#${r.rank}`}</span>
                  <span style={{ flex: 1, fontWeight: 600, color: THEME.text }}>{r.name}</span>
                  <span style={{ fontSize: 11, color: THEME.textMuted, padding: "2px 8px", background: THEME.bg, borderRadius: 4 }}>{r.tierLabel}</span>
                  <span style={{ fontFamily: "monospace", color: THEME.success, fontWeight: 700 }}>${r.salesThisMonth.toLocaleString()}</span>
                  <span style={{ fontSize: 12, color: THEME.textMuted }}>{r.recruitsCount} recruits</span>
                </div>
              );
            })}
          </div>
          {leaderboard.myRank && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${THEME.border}` }}>
              <div style={{ fontSize: 11, color: THEME.textMuted, fontWeight: 700, marginBottom: 8 }}>Your rank</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: THEME.accent + "22", border: `1px solid ${THEME.accent}`, borderRadius: 8 }}>
                <span style={{ fontWeight: 800, color: THEME.text }}>#{leaderboard.myRank.rank}</span>
                <span style={{ flex: 1, color: THEME.text }}>{leaderboard.myRank.name}</span>
                <span style={{ fontSize: 11, color: THEME.textMuted }}>{leaderboard.myRank.tierLabel}</span>
                <span style={{ fontFamily: "monospace", color: THEME.success, fontWeight: 700 }}>${leaderboard.myRank.salesThisMonth.toLocaleString()} this month</span>
                <span style={{ fontSize: 12, color: THEME.textMuted }}>{leaderboard.myRank.recruitsCount} recruits</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
        {[
          { label: "Total Clicks", value: String(data.totalClicks ?? 0) },
          { label: "Total Sales", value: `$${(data.totalSales ?? 0).toFixed(2)}` },
          { label: "Total Earned", value: `$${(data.totalEarned ?? 0).toFixed(2)}` },
          { label: "Pending Payout", value: `$${(data.pendingPayout ?? 0).toFixed(2)}` },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 11, color: THEME.textMuted, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "monospace", color: THEME.text }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Commission rate + progress */}
      <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: THEME.text }}>Commission & tier</h2>
        <p style={{ color: THEME.textMuted, marginBottom: 12 }}>Your current rate: <strong style={{ color: THEME.text }}>{data.commissionRate ?? 10}%</strong> on sales.</p>
        {data.nextTierThreshold != null && data.progress != null && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: THEME.textMuted, marginBottom: 6 }}>
              <span>Progress to next tier: ${(data.monthlyRevenue ?? 0).toFixed(0)} / ${data.nextTierThreshold}</span>
              <span>{Math.round((data.progress ?? 0) * 100)}%</span>
            </div>
            <div style={{ height: 8, background: THEME.bg, borderRadius: 4, overflow: "hidden" }}>
              <div style={{ width: `${Math.min(100, (data.progress ?? 0) * 100)}%`, height: "100%", background: `linear-gradient(90deg, ${THEME.accent}, ${THEME.success})`, borderRadius: 4 }} />
            </div>
          </div>
        )}
        {data.nextTierThreshold == null && <p style={{ fontSize: 12, color: THEME.textMuted }}>You’re at the top tier.</p>}
      </div>

      {/* Recent conversions */}
      <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: THEME.text }}>Recent conversions</h2>
        {aff.conversions.length === 0 ? (
          <p style={{ color: THEME.textMuted, fontSize: 14 }}>No conversions yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${THEME.border}` }}>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: THEME.textMuted, fontWeight: 600 }}>Date</th>
                  <th style={{ textAlign: "right", padding: "10px 12px", color: THEME.textMuted, fontWeight: 600 }}>Order</th>
                  <th style={{ textAlign: "right", padding: "10px 12px", color: THEME.textMuted, fontWeight: 600 }}>Commission</th>
                </tr>
              </thead>
              <tbody>
                {aff.conversions.slice(0, 15).map((c) => {
                  const rate = (data.commissionRate ?? 10) / 100;
                  const commission = c.amount * rate;
                  return (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${THEME.border}` }}>
                      <td style={{ padding: "10px 12px", color: THEME.text }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: THEME.text }}>${c.amount.toFixed(2)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: THEME.success }}>${commission.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {aff.conversions.length > 15 && (
          <Link href="/portal/earnings" style={{ display: "inline-block", marginTop: 12, fontSize: 13, color: THEME.accent }}>View all →</Link>
        )}
      </div>

      {/* My Team */}
      <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: THEME.text }}>People you recruited</h2>
        {aff.children.length === 0 ? (
          <p style={{ color: THEME.textMuted, fontSize: 14 }}>No recruits yet. Share your recruit link to grow your team.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${THEME.border}` }}>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: THEME.textMuted, fontWeight: 600 }}>Name</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: THEME.textMuted, fontWeight: 600 }}>Clicks</th>
                  <th style={{ textAlign: "right", padding: "10px 12px", color: THEME.textMuted, fontWeight: 600 }}>Sales</th>
                </tr>
              </thead>
              <tbody>
                {aff.children.map((c) => (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${THEME.border}` }}>
                    <td style={{ padding: "10px 12px", color: THEME.text }}>{c.name}</td>
                    <td style={{ padding: "10px 12px", color: THEME.text }}>{c.clicksCount}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: THEME.text }}>${c.totalSales.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Link href="/portal/team" style={{ display: "inline-block", marginTop: 12, fontSize: 13, color: THEME.accent }}>My Team →</Link>
      </div>

      {/* Payout history */}
      <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: THEME.text }}>Payout history</h2>
        {aff.payouts.length === 0 ? (
          <p style={{ color: THEME.textMuted, fontSize: 14 }}>No payouts yet.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {aff.payouts.map((p) => (
              <li key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${THEME.border}` }}>
                <span style={{ color: THEME.text }}>{new Date(p.paidAt).toLocaleDateString()}</span>
                <span style={{ fontWeight: 700, color: THEME.success }}>${p.amount.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
        <Link href="/portal/payouts" style={{ display: "inline-block", marginTop: 12, fontSize: 13, color: THEME.accent }}>Payouts & banking →</Link>
      </div>

      {/* Commission calculator */}
      {data.tiers && data.tiers.length > 0 && (
        <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: THEME.text }}>Commission calculator</h2>
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: THEME.textMuted, fontSize: 12, display: "block", marginBottom: 6 }}>Estimated monthly sales</label>
            <input type="range" min={0} max={20000} step={100} value={calcSales} onChange={e => setCalcSales(Number(e.target.value))}
              style={{ width: "100%", accentColor: THEME.accent }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 12, color: THEME.textMuted }}><span>$0</span><span style={{ fontFamily: "monospace", color: THEME.text, fontWeight: 700 }}>${calcSales.toLocaleString()}</span><span>$20,000</span></div>
          </div>
          {(() => {
            const tierIndex = getTierIndexForRevenue(calcSales, data.tiers);
            const tierRow = data.tiers[tierIndex];
            const rate = tierRow?.commission ?? 10;
            const mlm2Rate = tierRow && "mlm2" in tierRow ? (tierRow as { mlm2?: number }).mlm2 ?? 3 : 3;
            const direct = (calcSales * rate) / 100;
            const mlmOverride = 5 * calcSales * (mlm2Rate / 100);
            const totalMonthly = direct + mlmOverride;
            const totalAnnual = totalMonthly * 12;
            const shareText = `I could earn $${totalMonthly.toFixed(0)}/month with the BLL affiliate program. Join using my link: ${trackingLink}`;
            return (
              <>
                <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
                  <div style={{ padding: "8px 12px", background: THEME.bg, borderRadius: 8, fontSize: 12 }}>
                    <span style={{ color: THEME.textMuted }}>Tier: </span><strong style={{ color: THEME.text }}>{tierRow?.name ?? "—"}</strong> ({rate}% direct)
                  </div>
                  <div style={{ padding: "8px 12px", background: THEME.bg, borderRadius: 8, fontSize: 12 }}>
                    <span style={{ color: THEME.textMuted }}>Direct: </span><strong style={{ color: THEME.success }}>${direct.toFixed(2)}/mo</strong>
                  </div>
                  <div style={{ padding: "8px 12px", background: THEME.bg, borderRadius: 8, fontSize: 12 }}>
                    <span style={{ color: THEME.textMuted }}>+ 5 recruits: </span><strong style={{ color: THEME.accent }}>${mlmOverride.toFixed(2)}/mo</strong>
                  </div>
                </div>
                <div style={{ marginBottom: 12, fontSize: 14 }}>
                  <strong style={{ color: THEME.text }}>Total: ${totalMonthly.toFixed(2)}/month</strong>
                  <span style={{ color: THEME.textMuted, marginLeft: 8 }}>(${totalAnnual.toLocaleString()}/year)</span>
                </div>
                <button type="button" onClick={async () => { await navigator.clipboard.writeText(shareText); setCalcShareCopied(true); setTimeout(() => setCalcShareCopied(false), 2000); }}
                  style={{ padding: "8px 16px", background: THEME.accent, color: "#0f172a", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  {calcShareCopied ? "Copied!" : "Share this calculation"}
                </button>
              </>
            );
          })()}
        </div>
      )}

      {/* Tipalti onboarding */}
      {(aff.tipaltiStatus !== "active" && aff.tipaltiStatus !== "pending") && (
        <div style={{ background: THEME.warningBg, border: `1px solid ${THEME.warning}`, borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: THEME.text }}>Set up banking</h2>
          <p style={{ color: THEME.textMuted, fontSize: 14, marginBottom: 16 }}>To receive payouts, complete your payment profile. You’ll be redirected to our payment provider to add your bank or PayPal details.</p>
          <a href="/api/me/tipalti-onboarding" style={{ display: "inline-block", padding: "10px 20px", background: THEME.warning, color: "#0f172a", borderRadius: 8, fontWeight: 600, textDecoration: "none", fontSize: 14 }}>Complete setup →</a>
        </div>
      )}
    </div>
  );
}
