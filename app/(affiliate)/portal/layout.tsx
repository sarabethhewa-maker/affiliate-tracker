"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import OnboardingChecklist from "./OnboardingChecklist";

const THEME = {
  bg: "#f8fafc",
  card: "#ffffff",
  border: "#e2e8f0",
  text: "#1a1a1a",
  textMuted: "#4a5568",
  accent: "#1e3a5f",
  accentLight: "#3a7ca5",
  active: "#1e3a5f",
};

const navItems = [
  { href: "/portal/dashboard", label: "Dashboard" },
  { href: "/portal/links", label: "My Links" },
  { href: "/portal/earnings", label: "Earnings" },
  { href: "/portal/team", label: "My Team" },
  { href: "/portal/payouts", label: "Payouts" },
];

const ADMIN_BTN_STYLE: React.CSSProperties = {
  position: "fixed",
  top: 16,
  left: 16,
  zIndex: 100,
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 12px",
  fontSize: 12,
  fontWeight: 500,
  color: "#1a4a8a",
  background: "#ffffff",
  border: "1px solid #1a4a8a",
  borderRadius: 8,
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  textDecoration: "none",
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isGate = pathname === "/portal";

  const adminButton = (
    <Link href="/" style={ADMIN_BTN_STYLE} aria-label="Admin Login">
      <span>🔒</span>
      <span>Admin Login</span>
    </Link>
  );

  if (isGate) {
    return (
      <>
        {adminButton}
        {children}
      </>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: THEME.bg, fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: THEME.text }}>
      {adminButton}
      <header style={{ borderBottom: `1px solid ${THEME.border}`, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, background: THEME.card }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
          <Link
            href="/"
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              background: "transparent",
              color: THEME.accent,
              border: `1px solid ${THEME.accent}`,
            }}
          >
            Admin dashboard
          </Link>
          <Link href="/portal/dashboard" style={{ display: "flex", alignItems: "center", color: THEME.text, textDecoration: "none" }}>
            <img src="/logo.png" alt="Biolongevity Labs" style={{ height: 36, width: "auto", objectFit: "contain" }} />
          </Link>
          <nav style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {navItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
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
      </header>
      <main style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
        <OnboardingChecklist>{children}</OnboardingChecklist>
      </main>
    </div>
  );
}
