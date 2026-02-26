"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";

const THEME = {
  bg: "#f8fafc",
  card: "#ffffff",
  border: "#e2e8f0",
  text: "#1a1a1a",
  textMuted: "#4a5568",
  accent: "#1e3a5f",
  success: "#0d7a3d",
  warning: "#b45309",
  warningBg: "#fef3c7",
};

type MeResponse = {
  pending?: boolean;
  affiliate?: {
    id: string;
    name: string;
    tipaltiStatus: string | null;
    payouts: { id: string; amount: number; method: string; paidAt: string; payoutStatus: string | null }[];
    storeCredit?: number;
  };
  pendingPayout?: number;
  storeCredit?: number;
};

export default function PortalPayoutsPage() {
  const searchParams = useSearchParams();
  const previewId = searchParams.get("preview");
  const [data, setData] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div style={{ padding: 48, color: THEME.textMuted }}>Loading…</div>;
  if (data?.pending || !data?.affiliate) {
    return <div style={{ padding: 24, color: THEME.textMuted }}>Your account is pending approval.</div>;
  }

  const aff = data.affiliate!;
  const needsBanking = aff.tipaltiStatus !== "active" && aff.tipaltiStatus !== "pending";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: THEME.text }}>Payouts</h1>

      {needsBanking && (
        <div style={{ background: THEME.warningBg, border: `1px solid ${THEME.warning}`, borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: THEME.text }}>Set up banking</h2>
          <p style={{ color: THEME.textMuted, fontSize: 14, marginBottom: 16 }}>Complete your payment profile to receive payouts.</p>
          <a href="/api/me/tipalti-onboarding" style={{ display: "inline-block", padding: "10px 20px", background: THEME.warning, color: "#1a1a1a", borderRadius: 8, fontWeight: 600, textDecoration: "none", fontSize: 14 }}>Complete setup →</a>
        </div>
      )}

      <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: THEME.text }}>Pending payout</h2>
        <p style={{ fontSize: 28, fontWeight: 800, color: THEME.success }}>${(data.pendingPayout ?? 0).toFixed(2)}</p>
        <p style={{ fontSize: 13, color: THEME.textMuted }}>This amount will be paid out according to the program’s payout schedule once banking is set up and approved.</p>
      </div>

      {((data.storeCredit ?? aff.storeCredit ?? 0) > 0) && (
        <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: THEME.text }}>Store credit balance</h2>
          <p style={{ fontSize: 28, fontWeight: 800, color: THEME.accent }}>${(data.storeCredit ?? aff.storeCredit ?? 0).toFixed(2)}</p>
          <p style={{ fontSize: 13, color: THEME.textMuted }}>Store credit can be used on biolongevitylabs.com — contact us to apply.</p>
        </div>
      )}

      <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: THEME.text }}>Payment history</h2>
        {aff.payouts.length === 0 ? (
          <p style={{ color: THEME.textMuted }}>No payouts yet.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {aff.payouts.map((p) => (
              <li key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${THEME.border}` }}>
                <div>
                  <span style={{ color: THEME.text }}>{new Date(p.paidAt).toLocaleDateString()}</span>
                  <span style={{ marginLeft: 12, color: THEME.textMuted, fontSize: 13, textTransform: "capitalize" }}>{p.method.replace(/_/g, " ")}</span>
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
