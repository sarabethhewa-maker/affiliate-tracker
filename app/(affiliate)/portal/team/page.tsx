"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";

const THEME = {
  bg: "#0f172a",
  card: "#1e293b",
  border: "#334155",
  text: "#f1f5f9",
  textMuted: "#94a3b8",
  accent: "#38bdf8",
};

type MeResponse = {
  pending?: boolean;
  affiliate?: {
    children: { id: string; name: string; email: string; tier: string; status: string; clicksCount: number; conversionsCount: number; totalSales: number }[];
  };
  tiers?: { name: string }[];
};

export default function PortalTeamPage() {
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

  const children = data.affiliate!.children;
  const tierNames: Record<string, string> = {};
  (data.tiers ?? []).forEach((t, i) => {
    tierNames[String(i)] = t.name;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: THEME.text }}>My Team</h1>
      <p style={{ color: THEME.textMuted }}>People you have recruited. Share your recruit link to grow your team.</p>
      <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 24 }}>
        {children.length === 0 ? (
          <p style={{ color: THEME.textMuted }}>No recruits yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${THEME.border}` }}>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: THEME.textMuted, fontWeight: 600 }}>Name</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: THEME.textMuted, fontWeight: 600 }}>Tier</th>
                  <th style={{ textAlign: "right", padding: "10px 12px", color: THEME.textMuted, fontWeight: 600 }}>Clicks</th>
                  <th style={{ textAlign: "right", padding: "10px 12px", color: THEME.textMuted, fontWeight: 600 }}>Conversions</th>
                  <th style={{ textAlign: "right", padding: "10px 12px", color: THEME.textMuted, fontWeight: 600 }}>Total sales</th>
                </tr>
              </thead>
              <tbody>
                {children.map((c) => (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${THEME.border}` }}>
                    <td style={{ padding: "10px 12px", color: THEME.text }}>{c.name}</td>
                    <td style={{ padding: "10px 12px", color: THEME.text }}>{tierNames[c.tier] ?? c.tier}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: THEME.text }}>{c.clicksCount}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: THEME.text }}>{c.conversionsCount}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: THEME.text }}>${c.totalSales.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
