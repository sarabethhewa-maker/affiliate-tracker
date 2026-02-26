"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const THEME = {
  bg: "#f8fafc",
  card: "#ffffff",
  border: "#e2e8f0",
  text: "#1a1a2e",
  textMuted: "#4a5568",
  accent: "#1a4a8a",
};

type Announcement = {
  id: string;
  title: string;
  content: string;
  priority: string;
  pinned: boolean;
  publishedAt: string;
  expiresAt: string | null;
};

export default function PortalAnnouncementsPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/announcements")
      .then((r) => {
        if (r.status === 401 || r.status === 403) {
          router.replace("/portal");
          return [];
        }
        return r.ok ? r.json() : [];
      })
      .then((list) => setAnnouncements(Array.isArray(list) ? list : []))
      .catch(() => setAnnouncements([]))
      .finally(() => setLoading(false));
  }, [router]);

  const now = new Date();
  const active = announcements.filter(
    (a) => new Date(a.publishedAt) <= now && (!a.expiresAt || new Date(a.expiresAt) > now)
  );

  if (loading) {
    return (
      <div style={{ padding: 48, color: THEME.textMuted }}>Loading…</div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/portal/dashboard" style={{ color: THEME.textMuted, fontSize: 13, textDecoration: "none" }}>← Dashboard</Link>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: THEME.text, margin: 0 }}>Announcements</h1>
      </div>

      {active.length === 0 ? (
        <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 48, textAlign: "center", color: THEME.textMuted }}>
          No announcements at this time.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {active.map((a) => {
            const borderColor = a.priority === "urgent" ? "#b91c1c" : a.priority === "important" ? "#1a4a8a" : "#e2e8f0";
            return (
              <div
                key={a.id}
                style={{
                  background: THEME.card,
                  border: `1px solid ${THEME.border}`,
                  borderLeft: `4px solid ${borderColor}`,
                  borderRadius: 12,
                  padding: 24,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 18, color: THEME.text }}>{a.title}</span>
                  {a.pinned && <span style={{ fontSize: 14 }} title="Pinned">📌</span>}
                </div>
                <p style={{ color: THEME.textMuted, fontSize: 14, margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{a.content}</p>
                <div style={{ marginTop: 12, fontSize: 12, color: THEME.textMuted }}>
                  {new Date(a.publishedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
