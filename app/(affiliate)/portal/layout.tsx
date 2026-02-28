"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, UserButton } from "@clerk/nextjs";
import OnboardingChecklist from "./OnboardingChecklist";
import ChatWidget from "@/app/components/ChatWidget";
import { GuidedTour, getPortalTourSteps } from "@/app/components/GuidedTour";
import ThemeToggle from "@/app/components/ThemeToggle";

const THEME = {
  bg: "var(--theme-bg)",
  card: "var(--theme-card)",
  border: "var(--theme-border)",
  text: "var(--theme-text)",
  textMuted: "var(--theme-text-muted)",
  accent: "var(--theme-accent)",
  accentLight: "var(--theme-accent-light)",
  active: "var(--theme-accent)",
};

type NotificationItem = { id: string; type: string; title: string; body: string; read: boolean; createdAt: string; link?: string; meta?: Record<string, unknown> };

function relativeTime(createdAt: string) {
  const d = new Date(createdAt);
  const now = new Date();
  const sec = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} hours ago`;
  if (sec < 172800) return "Yesterday";
  return d.toLocaleDateString();
}

function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    const r = await fetch("/api/portal/notifications");
    const data = r.ok ? await r.json().catch(() => ({})) : {};
    setNotifications(data.notifications ?? []);
    setUnreadCount(data.unreadCount ?? 0);
  }, []);

  useEffect(() => {
    fetchNotifications();
    const t = setInterval(fetchNotifications, 60000);
    return () => clearInterval(t);
  }, [fetchNotifications]);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onOutside);
    return () => document.removeEventListener("click", onOutside);
  }, [open]);

  const markRead = async (notificationId: string | null) => {
    await fetch("/api/portal/notifications/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(notificationId ? { notificationId } : { all: true }),
    });
    fetchNotifications();
  };

  const handleNotificationClick = (n: NotificationItem) => {
    if (!n.read) markRead(n.id);
    setOpen(false);
    if (n.type === "announcement" && (n.link || n.meta?.announcementId)) {
      router.push("/portal/announcements");
      return;
    }
    if (n.type === "direct_message") {
      router.push("/portal/notifications");
      return;
    }
    if (n.type === "payout") {
      router.push("/portal/payouts");
      return;
    }
    if (n.type === "tier_change" || n.type === "application_approved") {
      router.push("/portal/dashboard");
      return;
    }
    if (n.type === "new_sub_affiliate") {
      router.push("/portal/team");
      return;
    }
    if (n.link) router.push(n.link);
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

  const hasUnread = unreadCount > 0;

  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }} ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        style={{
          position: "relative",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 8,
          borderRadius: 8,
          color: THEME.textMuted,
        }}
      >
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", animation: hasUnread ? "portal-bell-pulse 2s ease-in-out infinite" : undefined }}>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {hasUnread && (
          <span
            style={{
              position: "absolute",
              top: 2,
              right: 2,
              background: "#ef4444",
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              minWidth: 18,
              height: 18,
              borderRadius: "50%",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: 8,
            width: 360,
            maxHeight: 450,
            overflow: "hidden",
            background: THEME.card,
            border: `1px solid ${THEME.border}`,
            borderRadius: 12,
            boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
            zIndex: 200,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${THEME.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: THEME.text }}>Notifications</span>
            {notifications.some((n) => !n.read) && (
              <button
                type="button"
                onClick={() => markRead(null)}
                style={{ background: "none", border: "none", color: THEME.accent, fontSize: 12, cursor: "pointer", fontWeight: 600 }}
              >
                Mark all as read
              </button>
            )}
          </div>
          <div style={{ overflowY: "auto", flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: THEME.textMuted, fontSize: 14 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
                You&apos;re all caught up! No new notifications.
              </div>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleNotificationClick(n)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "12px 16px",
                    border: "none",
                    borderBottom: `1px solid ${THEME.border}`,
                    background: n.read ? THEME.card : "var(--theme-unread-bg)",
                    cursor: "pointer",
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                  }}
                >
                  {!n.read && <span style={{ width: 6, height: 6, borderRadius: "50%", background: THEME.accent, flexShrink: 0, marginTop: 6 }} />}
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{iconForType(n.type)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: n.read ? 400 : 700, fontSize: 13, color: THEME.text, marginBottom: 2 }}>{n.title}</div>
                    <div style={{ fontSize: 12, color: THEME.textMuted, lineHeight: 1.4 }}>{(n.body || "").slice(0, 80)}{(n.body || "").length > 80 ? "…" : ""}</div>
                    <div style={{ fontSize: 11, color: THEME.textMuted, marginTop: 4 }}>{relativeTime(n.createdAt)}</div>
                  </div>
                </button>
              ))
            )}
          </div>
          {notifications.length > 0 && (
            <div style={{ padding: "10px 16px", borderTop: `1px solid ${THEME.border}`, flexShrink: 0 }}>
              <Link href="/portal/notifications" style={{ fontSize: 12, color: THEME.accent, fontWeight: 600 }} onClick={() => setOpen(false)}>
                View all notifications →
              </Link>
            </div>
          )}
        </div>
      )}
      <style>{`@keyframes portal-bell-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }`}</style>
    </div>
  );
}

const navItems = [
  { href: "/portal/dashboard", label: "Dashboard", tourId: "portal-dashboard" as const },
  { href: "/portal/links", label: "My Links", tourId: "portal-links" as const },
  { href: "/portal/templates", label: "Templates", tourId: null },
  { href: "/portal/earnings", label: "Earnings", tourId: "portal-earnings" as const },
  { href: "/portal/team", label: "My Team", tourId: "portal-team" as const },
  { href: "/portal/payouts", label: "Payouts", tourId: null },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isGate = pathname === "/portal";
  const { isSignedIn } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!isSignedIn) {
      setIsAdmin(false);
      return;
    }
    fetch("/api/me/admin-check")
      .then((r) => r.json())
      .then((data) => setIsAdmin(!!data?.isAdmin))
      .catch(() => setIsAdmin(false));
  }, [isSignedIn]);

  if (isGate) {
    return (
      <>
        {children}
        <ChatWidget context="portal" label="Ask anything about our program" />
      </>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: THEME.bg, fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: THEME.text }}>
      <header style={{ borderBottom: `1px solid ${THEME.border}`, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, background: THEME.card }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
          <Link href="/portal/dashboard" style={{ display: "flex", alignItems: "center", color: THEME.text, textDecoration: "none" }}>
            <img src="/logo.png" alt="Biolongevity Labs" style={{ height: 36, width: "auto", objectFit: "contain" }} />
          </Link>
          <nav style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <GuidedTour tourId="portal" steps={getPortalTourSteps()} pulse buttonLabel="🎓 Tour" style={{ padding: "8px 14px", borderRadius: 8, fontSize: 14, fontWeight: 600, background: THEME.card, border: `1px solid ${THEME.border}`, color: THEME.textMuted, cursor: "pointer" }} />
            {navItems.map(({ href, label, tourId }) => (
              <Link
                key={href}
                href={href}
                {...(tourId ? { "data-tour": tourId } : {})}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                  background: pathname === href ? THEME.bg : "transparent",
                  color: pathname === href ? THEME.active : THEME.textMuted,
                  border: `1px solid ${pathname === href ? THEME.border : "transparent"}`,
                }}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {isAdmin && (
            <Link
              href="/dashboard"
              style={{
                padding: "5px 12px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                textDecoration: "none",
                background: "transparent",
                color: THEME.accent,
                border: `1px solid ${THEME.border}`,
              }}
            >
              Admin Dashboard
            </Link>
          )}
          <ThemeToggle />
          <NotificationBell />
          <UserButton />
        </div>
      </header>
      <main style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
        <OnboardingChecklist>{children}</OnboardingChecklist>
      </main>
      <ChatWidget context="portal" label="Ask anything about our program" />
    </div>
  );
}
