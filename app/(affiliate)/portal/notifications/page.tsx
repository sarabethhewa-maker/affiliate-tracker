"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const THEME = {
  bg: "var(--theme-bg)",
  card: "var(--theme-card)",
  border: "var(--theme-border)",
  text: "var(--theme-text)",
  textMuted: "var(--theme-text-muted)",
  accent: "var(--theme-accent)",
};

type NotificationItem = { id: string; type: string; title: string; body: string; read: boolean; createdAt: string; link?: string; meta?: Record<string, unknown> };

export default function PortalNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageModal, setMessageModal] = useState<NotificationItem | null>(null);

  useEffect(() => {
    fetch("/api/portal/notifications")
      .then((r) => (r.ok ? r.json() : { notifications: [] }))
      .then((data) => setNotifications(data.notifications ?? []))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, []);

  const markRead = async (id: string) => {
    await fetch("/api/portal/notifications/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: id }),
    });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const iconForType = (type: string) => {
    if (type === "announcement") return "📢";
    if (type === "direct_message") return "💬";
    if (type === "payout") return "💰";
    if (type === "tier_change") return "⬆️";
    if (type === "application_approved") return "✅";
    if (type === "new_sub_affiliate") return "👤";
    return "🔔";
  };

  const openNotification = (n: NotificationItem) => {
    if (!n.read) markRead(n.id);
    if (n.type === "direct_message") setMessageModal(n);
    else if (n.type === "announcement") router.push("/portal/announcements");
    else if (n.type === "payout") router.push("/portal/payouts");
    else if (n.type === "tier_change" || n.type === "application_approved") router.push("/portal/dashboard");
    else if (n.type === "new_sub_affiliate") router.push("/portal/team");
    else if (n.link) router.push(n.link);
  };

  if (loading) {
    return <div style={{ padding: 48, color: THEME.textMuted }}>Loading…</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/portal/dashboard" style={{ color: THEME.textMuted, fontSize: 13, textDecoration: "none" }}>← Dashboard</Link>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: THEME.text, margin: 0 }}>Notifications</h1>
      </div>
      {notifications.length === 0 ? (
        <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 48, textAlign: "center", color: THEME.textMuted }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
          <p style={{ margin: 0, fontSize: 15 }}>You&apos;re all caught up! No notifications yet.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => openNotification(n)}
              style={{
                textAlign: "left",
                padding: 16,
                border: `1px solid ${THEME.border}`,
                borderRadius: 12,
                background: n.read ? THEME.card : "#f0f5ff",
                cursor: "pointer",
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              <span style={{ fontSize: 20 }}>{iconForType(n.type)}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: n.read ? 400 : 700, fontSize: 15, color: THEME.text, marginBottom: 4 }}>{n.title}</div>
                <p style={{ fontSize: 14, color: THEME.textMuted, margin: 0, whiteSpace: "pre-wrap" }}>{n.body}</p>
                <div style={{ fontSize: 12, color: THEME.textMuted, marginTop: 8 }}>{new Date(n.createdAt).toLocaleString()}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {messageModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setMessageModal(null)}>
          <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 24, maxWidth: 440, width: "100%", boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: THEME.text, margin: 0 }}>{messageModal.title}</h2>
              <button type="button" onClick={() => setMessageModal(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: THEME.textMuted }}>×</button>
            </div>
            <p style={{ color: THEME.textMuted, fontSize: 14, whiteSpace: "pre-wrap", margin: 0 }}>{messageModal.body}</p>
            <div style={{ marginTop: 16, fontSize: 12, color: THEME.textMuted }}>{new Date(messageModal.createdAt).toLocaleString()}</div>
          </div>
        </div>
      )}
    </div>
  );
}
