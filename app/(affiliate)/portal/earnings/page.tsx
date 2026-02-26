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
};

type MeResponse = {
  pending?: boolean;
  affiliate?: {
    conversions: Array<{
      id: string;
      amount: number;
      status: string;
      product: string | null;
      createdAt: string;
    }>;
  };
  commissionRate?: number;
};

export default function PortalEarningsPage() {
  const searchParams = useSearchParams();
  const previewId = searchParams.get("preview");
  const [data, setData] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const url = previewId
      ? `/api/me/affiliate?preview=${encodeURIComponent(previewId)}`
      : "/api/me/affiliate";
    const res = await fetch(url);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [previewId]);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  if (loading) {
    return (
      <div style={{ padding: 48, color: THEME.textMuted }}>Loading…</div>
    );
  }
  if (data?.pending || !data?.affiliate) {
    return (
      <div style={{ padding: 24, color: THEME.textMuted }}>
        Your account is pending approval.
      </div>
    );
  }

  const rate = (data.commissionRate ?? 10) / 100;
  const conversions = data.affiliate.conversions;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: THEME.text }}>
        Earnings
      </h1>
      <div
        style={{
          background: THEME.card,
          border: `1px solid ${THEME.border}`,
          borderRadius: 12,
          padding: 24,
        }}
      >
        <p style={{ color: THEME.textMuted, marginBottom: 16 }}>
          Your commission rate:{" "}
          <strong style={{ color: THEME.text }}>
            {data.commissionRate ?? 10}%
          </strong>
        </p>
        {conversions.length === 0 ? (
          <p style={{ color: THEME.textMuted }}>No conversions yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 14,
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: `1px solid ${THEME.border}`,
                  }}
                >
                  <th
                    style={{
                      textAlign: "left",
                      padding: "10px 12px",
                      color: THEME.textMuted,
                      fontWeight: 600,
                    }}
                  >
                    Date
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "10px 12px",
                      color: THEME.textMuted,
                      fontWeight: 600,
                    }}
                  >
                    Order amount
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "10px 12px",
                      color: THEME.textMuted,
                      fontWeight: 600,
                    }}
                  >
                    Commission
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "10px 12px",
                      color: THEME.textMuted,
                      fontWeight: 600,
                    }}
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {conversions.map((c) => (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: `1px solid ${THEME.border}`,
                    }}
                  >
                    <td
                      style={{
                        padding: "10px 12px",
                        color: THEME.text,
                      }}
                    >
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        textAlign: "right",
                        color: THEME.text,
                      }}
                    >
                      ${c.amount.toFixed(2)}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        textAlign: "right",
                        color: THEME.success,
                      }}
                    >
                      ${(c.amount * rate).toFixed(2)}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        color: THEME.textMuted,
                        textTransform: "capitalize",
                      }}
                    >
                      {c.status}
                    </td>
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
