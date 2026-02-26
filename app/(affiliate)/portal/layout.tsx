"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import OnboardingChecklist from "./OnboardingChecklist";

const THEME = {
  bg: "#0f172a",
  card: "#1e293b",
  border: "#334155",
  text: "#f1f5f9",
  textMuted: "#94a3b8",
  accent: "#38bdf8",
  active: "#7dd3fc",
};

const navItems = [
  { href: "/portal", label: "Dashboard" },
  { href: "/portal/links", label: "My Links" },
  { href: "/portal/earnings", label: "Earnings" },
  { href: "/portal/team", label: "My Team" },
  { href: "/portal/payouts", label: "Payouts" },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={{ minHeight: "100vh", background: THEME.bg, fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: THEME.text }}>
      <header style={{ borderBottom: `1px solid ${THEME.border}`, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <Link href="/portal" style={{ color: THEME.text, fontSize: 18, fontWeight: 800, textDecoration: "none" }}>
            Affiliate Portal
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
                  background: pathname === href ? THEME.card : "transparent",
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
          <Link href="/" style={{ fontSize: 13, color: THEME.textMuted, textDecoration: "none" }}>Admin</Link>
        </div>
      </header>
      <main style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
        <OnboardingChecklist>{children}</OnboardingChecklist>
      </main>
    </div>
  );
}
