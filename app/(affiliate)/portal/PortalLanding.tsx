"use client";

import { useState } from "react";
import { SignInButton } from "@clerk/nextjs";
import ApplicationModal from "./ApplicationModal";

const THEME = {
  bg: "#ffffff",
  bgAlt: "#f8f9fa",
  border: "#e2e8f0",
  text: "#1a1a2e",
  textMuted: "#4a5568",
  accent: "#1a4a8a",
  gold: "#f0c040",
  success: "#38a169",
};

const benefits = [
  {
    title: "Industry-Leading Commissions",
    description: "Earn up to 20% on every sale with our tiered commission structure. The more you sell, the more you earn.",
    icon: "💰",
  },
  {
    title: "Build Your Network",
    description: "Recruit other affiliates and earn override commissions on their sales too. True passive income through our MLM structure.",
    icon: "🌐",
  },
  {
    title: "Real-Time Dashboard",
    description: "Track your clicks, sales, and earnings in real time. Full visibility into your performance 24/7.",
    icon: "📈",
  },
  {
    title: "Fast Payouts",
    description: "Get paid reliably via bank transfer, PayPal, or Venmo. Automated payouts through Tipalti.",
    icon: "⚡",
  },
];

const tiers = [
  { name: "Silver", rate: "10%", tagline: "Perfect for getting started", level: "entry level" },
  { name: "Gold", rate: "15%", tagline: "For affiliates generating $2,000+/month", level: "★ Most Popular", featured: true },
  { name: "Master", rate: "20%", tagline: "For top performers generating $5,000+/month", level: "top tier" },
];

const steps = [
  { title: "Apply", desc: "Fill out our simple application" },
  { title: "Get Approved", desc: "We review within 48 hours" },
  { title: "Start Earning", desc: "Share your link and earn" },
];

const stats = [
  { value: "$1M+", label: "paid to affiliates" },
  { value: "500+", label: "active partners" },
  { value: "Up to 20%", label: "commission" },
];

type Props = {
  prefilledEmail?: string;
  autoOpenModal?: boolean;
};

export default function PortalLanding({ prefilledEmail = "", autoOpenModal = false }: Props) {
  const [modalOpen, setModalOpen] = useState(autoOpenModal);

  return (
    <>
      <div style={{ minHeight: "100vh", background: THEME.bg, fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
        {/* Hero */}
        <section
          style={{
            background: "linear-gradient(180deg, #f0f7ff 0%, #ffffff 100%)",
            padding: "48px 24px 56px",
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
              <img src="/logo.png" alt="Biolongevity Labs" style={{ height: 60, width: "auto", objectFit: "contain" }} className="portal-hero-logo" />
            </div>
            <style>{`@media (max-width: 768px) { .portal-hero-logo { height: 45px !important; } }`}</style>
            <h1
              style={{
                fontSize: "clamp(28px, 4vw, 38px)",
                fontWeight: 800,
                color: THEME.text,
                marginBottom: 16,
                lineHeight: 1.2,
              }}
            >
              Earn with Biolongevity Labs
            </h1>
            <p
              style={{
                fontSize: "clamp(16px, 2vw, 18px)",
                color: THEME.textMuted,
                lineHeight: 1.6,
                marginBottom: 32,
              }}
            >
              Join our affiliate program and earn up to 20% commission on every sale plus bonuses for building your team.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginBottom: 24 }}>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                style={{
                  padding: "14px 28px",
                  background: THEME.accent,
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(26, 74, 138, 0.35)",
                }}
              >
                Apply Now
              </button>
              <SignInButton mode="modal" forceRedirectUrl="/portal">
                <span
                  style={{
                    padding: "14px 28px",
                    color: THEME.accent,
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: "pointer",
                    textDecoration: "none",
                  }}
                >
                  Already an affiliate? Sign In
                </span>
              </SignInButton>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section style={{ padding: "48px 24px 56px", background: THEME.bgAlt }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 30px)", fontWeight: 800, color: THEME.text, textAlign: "center", marginBottom: 32 }}>
              Why Partner With Biolongevity Labs?
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
              {benefits.map((b, i) => (
                <div
                  key={i}
                  style={{
                    background: THEME.bg,
                    border: `1px solid ${THEME.border}`,
                    borderRadius: 12,
                    padding: 28,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 12 }}>{b.icon}</div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: THEME.text, marginBottom: 8 }}>{b.title}</h3>
                  <p style={{ fontSize: 14, color: THEME.textMuted, lineHeight: 1.5 }}>{b.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Commission Tiers */}
        <section style={{ padding: "48px 24px 56px", background: THEME.bg }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 30px)", fontWeight: 800, color: THEME.text, textAlign: "center", marginBottom: 32 }}>
              Your Earning Potential
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24, alignItems: "stretch" }}>
              {tiers.map((t, i) => (
                <div
                  key={i}
                  style={{
                    background: t.featured ? "linear-gradient(135deg, #f0f7ff 0%, #e8f0fe 100%)" : THEME.bgAlt,
                    border: t.featured ? `2px solid ${THEME.accent}` : `1px solid ${THEME.border}`,
                    borderRadius: 12,
                    padding: 28,
                    boxShadow: t.featured ? "0 8px 24px rgba(26, 74, 138, 0.15)" : "0 4px 12px rgba(0,0,0,0.04)",
                    position: "relative",
                  }}
                >
                  {t.featured && (
                    <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: THEME.accent, color: "#fff", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20 }}>
                      {t.level}
                    </div>
                  )}
                  <div style={{ fontSize: 14, color: THEME.textMuted, marginBottom: 8, fontWeight: 600 }}>{t.name}</div>
                  <div style={{ fontSize: 36, fontWeight: 800, color: THEME.accent, marginBottom: 8 }}>{t.rate}</div>
                  <p style={{ fontSize: 14, color: THEME.textMuted, lineHeight: 1.5 }}>{t.tagline}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section style={{ padding: "48px 24px 56px", background: THEME.bgAlt }}>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 30px)", fontWeight: 800, color: THEME.text, textAlign: "center", marginBottom: 32 }}>
              How It Works
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24 }}>
              {steps.map((s, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: THEME.accent, color: "#fff", fontSize: 20, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>{i + 1}</div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: THEME.text, marginBottom: 8 }}>{s.title}</h3>
                  <p style={{ fontSize: 14, color: THEME.textMuted, lineHeight: 1.5 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Social proof */}
        <section style={{ padding: "48px 24px 56px", background: THEME.bg }}>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 30px)", fontWeight: 800, color: THEME.text, textAlign: "center", marginBottom: 32 }}>
              Join Our Growing Network
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 24 }}>
              {stats.map((s, i) => (
                <div
                  key={i}
                  style={{
                    background: THEME.bgAlt,
                    border: `1px solid ${THEME.border}`,
                    borderRadius: 12,
                    padding: 24,
                    textAlign: "center",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
                  }}
                >
                  <div style={{ fontSize: 28, fontWeight: 800, color: THEME.accent, marginBottom: 4 }}>{s.value}</div>
                  <div style={{ fontSize: 14, color: THEME.textMuted }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: "40px 24px 56px", textAlign: "center", background: THEME.bg }}>
          <p style={{ fontSize: 15, color: THEME.textMuted, marginBottom: 16 }}>Ready to start earning?</p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            style={{
              padding: "14px 28px",
              background: THEME.accent,
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Apply Now
          </button>
        </section>
      </div>

      {modalOpen && (
        <ApplicationModal
          prefilledEmail={prefilledEmail}
          onClose={() => setModalOpen(false)}
          onSuccess={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
