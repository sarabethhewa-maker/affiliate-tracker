"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";

const THEME = {
  bg: "var(--theme-bg)",
  card: "var(--theme-card)",
  border: "var(--theme-border)",
  text: "var(--theme-text)",
  textMuted: "var(--theme-text-muted)",
  accent: "var(--theme-accent)",
  success: "var(--theme-success)",
  successBg: "var(--theme-success-bg)",
  warning: "var(--theme-warning)",
  warningBg: "var(--theme-warning-bg)",
  error: "var(--theme-error)",
  errorBg: "var(--theme-error-bg)",
};

type OrderItem = { name?: string; quantity?: number; total?: string };

type ConversionRow = {
  id: string;
  amount: number;
  status: string;
  product: string | null;
  orderId: string | null;
  orderNumber: string | null;
  orderStatus: string | null;
  orderItems: OrderItem[] | null;
  customerName: string | null;
  customerCity: string | null;
  paidAt: string | null;
  createdAt: string;
};

type MeResponse = {
  pending?: boolean;
  affiliate?: {
    conversions: ConversionRow[];
  };
  commissionRate?: number;
};

function itemsSummary(items: OrderItem[] | null): string {
  if (!items || !Array.isArray(items) || items.length === 0) return "—";
  return items.map((i) => (i.name ?? "Product") + (i.quantity && i.quantity > 1 ? ` ×${i.quantity}` : "")).join(", ");
}

function StatusBadge({ orderStatus, status }: { orderStatus: string | null; status: string }) {
  const os = (orderStatus ?? status ?? "").toLowerCase();
  if (os === "refunded") {
    return (
      <span style={{ background: THEME.errorBg, color: THEME.error, border: `1px solid ${THEME.error}60`, borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 600 }}>
        Refunded
      </span>
    );
  }
  if (os === "completed") {
    return (
      <span style={{ background: THEME.successBg, color: THEME.success, border: `1px solid ${THEME.success}60`, borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 600 }}>
        Completed
      </span>
    );
  }
  return (
    <span style={{ background: THEME.warningBg, color: THEME.warning, border: `1px solid ${THEME.warning}60`, borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 600 }}>
      Processing
    </span>
  );
}

export default function PortalEarningsPage() {
  const searchParams = useSearchParams();
  const previewId = searchParams.get("preview");
  const [data, setData] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
  const conversions = data.affiliate.conversions as ConversionRow[];

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
          boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
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
                <tr style={{ borderBottom: `2px solid ${THEME.border}` }}>
                  <th style={{ textAlign: "left", padding: "12px 10px", color: THEME.textMuted, fontWeight: 600 }}>Date</th>
                  <th style={{ textAlign: "left", padding: "12px 10px", color: THEME.textMuted, fontWeight: 600 }}>Order #</th>
                  <th style={{ textAlign: "left", padding: "12px 10px", color: THEME.textMuted, fontWeight: 600 }}>Items purchased</th>
                  <th style={{ textAlign: "right", padding: "12px 10px", color: THEME.textMuted, fontWeight: 600 }}>Order total</th>
                  <th style={{ textAlign: "right", padding: "12px 10px", color: THEME.textMuted, fontWeight: 600 }}>Your commission</th>
                  <th style={{ textAlign: "left", padding: "12px 10px", color: THEME.textMuted, fontWeight: 600 }}>Status</th>
                  <th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {conversions.map((c) => {
                  const isExpanded = expandedId === c.id;
                  const items = Array.isArray(c.orderItems) ? c.orderItems : [];
                  const commission = c.amount * rate;
                  return (
                    <React.Fragment key={c.id}>
                      <tr
                        onClick={() => setExpandedId(isExpanded ? null : c.id)}
                        style={{
                          borderBottom: `1px solid ${THEME.border}`,
                          cursor: "pointer",
                          background: isExpanded ? "#f8f9fa" : undefined,
                        }}
                      >
                        <td style={{ padding: "12px 10px", color: THEME.text }}>
                          {new Date(c.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                        </td>
                        <td style={{ padding: "12px 10px", color: THEME.text, fontFamily: "monospace" }}>
                          {c.orderNumber ? `#${c.orderNumber}` : c.orderId ? `#${c.orderId}` : "—"}
                        </td>
                        <td style={{ padding: "12px 10px", color: THEME.textMuted, fontSize: 13, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {itemsSummary(c.orderItems)}
                        </td>
                        <td style={{ padding: "12px 10px", textAlign: "right", color: THEME.text, fontFamily: "monospace" }}>
                          ${c.amount.toFixed(2)}
                        </td>
                        <td style={{ padding: "12px 10px", textAlign: "right", color: THEME.success, fontWeight: 600, fontFamily: "monospace" }}>
                          ${commission.toFixed(2)}
                        </td>
                        <td style={{ padding: "12px 10px" }}>
                          <StatusBadge orderStatus={c.orderStatus} status={c.status} />
                        </td>
                        <td style={{ padding: "12px 10px", color: THEME.textMuted, fontSize: 18 }}>{isExpanded ? "▼" : "▶"}</td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} style={{ padding: 0, borderBottom: `1px solid ${THEME.border}`, background: "#f8f9fa", verticalAlign: "top" }}>
                            <div style={{ padding: "16px 20px 20px", fontSize: 13 }}>
                              <div style={{ fontWeight: 700, color: THEME.text, marginBottom: 10 }}>Order details</div>
                              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 12px 0" }}>
                                {(items.length ? items : [{ name: c.product || "Sale", quantity: 1, total: String(c.amount) }]).map((item, i) => (
                                  <li key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${THEME.border}` }}>
                                    <span style={{ color: THEME.text }}>{(item as OrderItem).name ?? "Product"}</span>
                                    <span style={{ color: THEME.textMuted }}>{(item as OrderItem).quantity ?? 1} × ${(item as OrderItem).total ?? c.amount.toFixed(2)}</span>
                                  </li>
                                ))}
                              </ul>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 8 }}>
                                <span style={{ color: THEME.textMuted }}><strong style={{ color: THEME.text }}>Commission:</strong> {data.commissionRate ?? 10}% of ${c.amount.toFixed(2)} = <strong style={{ color: THEME.success }}>${commission.toFixed(2)}</strong></span>
                              </div>
                              {c.paidAt && (
                                <div style={{ color: THEME.textMuted }}>Date credited: {new Date(c.paidAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</div>
                              )}
                              {(c.orderStatus ?? "").toLowerCase() === "refunded" && (
                                <div style={{ color: THEME.error, marginTop: 8 }}>This order was refunded. Commission was reversed.</div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
