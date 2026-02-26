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
    title: "Earn 10–20% commission",
    description: "Tiered rates based on your sales volume. The more you sell, the higher your rate—up to 20% on every sale.",
    icon: "💰",
  },
  {
    title: "Build your downline",
    description: "Recruit other affiliates and earn override commissions on their sales. Our MLM structure rewards team building.",
    icon: "📈",
  },
  {
    title: "Get paid fast",
    description: "Regular payouts via PayPal, bank transfer, or Tipalti. Approved conversions are paid on your chosen schedule.",
    icon: "⚡",
  },
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
        <section style={{ padding: "40px 24px 56px", background: THEME.bgAlt }}>
          <div style={{ maxWidth: 960, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
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
