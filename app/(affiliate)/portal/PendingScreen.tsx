"use client";

import Link from "next/link";

const THEME = {
  bg: "#f8f9fa",
  card: "#ffffff",
  border: "#e2e8f0",
  text: "#1a1a2e",
  textMuted: "#4a5568",
  accent: "#1a4a8a",
};

type Props = {
  name: string;
  email: string;
  createdAt: string;
  contactUrl?: string;
};

export default function PendingScreen({ name, email, createdAt, contactUrl = "mailto:support@biolongevitylabs.com" }: Props) {
  const appliedDate = new Date(createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

  return (
    <div style={{ minHeight: "100vh", background: THEME.bg, fontFamily: "'DM Sans', 'Segoe UI', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 440, width: "100%", background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 16, padding: 40, boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: THEME.text, marginBottom: 12, textAlign: "center" }}>
          Your application is under review
        </h1>
        <p style={{ color: THEME.textMuted, fontSize: 15, lineHeight: 1.5, marginBottom: 28, textAlign: "center" }}>
          We&apos;ll notify you by email within 48 hours once approved.
        </p>
        <div style={{ background: THEME.bg, border: `1px solid ${THEME.border}`, borderRadius: 10, padding: 20, marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: THEME.textMuted, letterSpacing: 1, marginBottom: 12, textTransform: "uppercase" }}>Application details</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div><span style={{ color: THEME.textMuted, fontSize: 13 }}>Name</span><br /><span style={{ color: THEME.text, fontWeight: 600 }}>{name}</span></div>
            <div><span style={{ color: THEME.textMuted, fontSize: 13 }}>Email</span><br /><span style={{ color: THEME.text, fontWeight: 600 }}>{email}</span></div>
            <div><span style={{ color: THEME.textMuted, fontSize: 13 }}>Submitted</span><br /><span style={{ color: THEME.text, fontWeight: 600 }}>{appliedDate}</span></div>
          </div>
        </div>
        <p style={{ textAlign: "center", fontSize: 14, color: THEME.textMuted }}>
          Have questions?{" "}
          <a href={contactUrl} style={{ color: THEME.accent, fontWeight: 600, textDecoration: "none" }}>Contact us</a>
        </p>
      </div>
    </div>
  );
}
