"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";

const THEME = {
  bg: "#f8fafc",
  card: "#ffffff",
  border: "#e2e8f0",
  text: "#1a1a1a",
  textMuted: "#4a5568",
  accent: "#1e3a5f",
  success: "#0d7a3d",
  warning: "#b45309",
};

const STORAGE_KEYS = {
  copiedLink: "onboarding_copied_link",
  visitedLinks: "onboarding_visited_links",
  done: "onboarding_done",
  modalDismissed: "onboarding_modal_dismissed",
};

function getStored(key: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(key) === "1";
}

function setStored(key: string, value: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, value ? "1" : "0");
}

export function setOnboardingCopiedLink() {
  setStored(STORAGE_KEYS.copiedLink, true);
}

export function setOnboardingVisitedLinks() {
  setStored(STORAGE_KEYS.visitedLinks, true);
}

type MeData = {
  affiliate?: {
    id: string;
    tipaltiStatus?: string | null;
    children?: { id: string }[];
  };
};

export default function OnboardingChecklist({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<MeData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const [congratsDone, setCongratsDone] = useState(false);

  const accountCreated = !!me?.affiliate;
  const copiedLink = getStored(STORAGE_KEYS.copiedLink);
  const visitedLinks = getStored(STORAGE_KEYS.visitedLinks);
  const payoutSetup = me?.affiliate?.tipaltiStatus === "active" || me?.affiliate?.tipaltiStatus === "pending";
  const firstRecruit = (me?.affiliate?.children?.length ?? 0) > 0;

  const steps = [
    { id: "account", label: "Account created", done: accountCreated, href: null },
    { id: "link", label: "Copy your tracking link", done: copiedLink, href: "/portal/dashboard" },
    { id: "payout", label: "Set up your payout method", done: payoutSetup, href: "/api/me/tipalti-onboarding" },
    { id: "share", label: "Make your first share", done: visitedLinks, href: "/portal/links" },
    { id: "recruit", label: "Recruit your first sub-affiliate", done: firstRecruit, href: "/portal/dashboard" },
  ];

  const completed = steps.filter((s) => s.done).length;
  const total = steps.length;
  const progress = total ? completed / total : 1;
  const allDone = progress >= 1;
  const alreadyDone = getStored(STORAGE_KEYS.done);

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch("/api/me/affiliate");
      const data = await res.json();
      setMe(data);
    } catch {
      setMe(null);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (alreadyDone) return;
    if (!allDone || !me?.affiliate) return;
    setStored(STORAGE_KEYS.done, true);
    setShowCongrats(true);
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
  }, [allDone, me?.affiliate, alreadyDone]);

  useEffect(() => {
    if (!me) return;
    const dismissed = getStored(STORAGE_KEYS.modalDismissed);
    if (!dismissed && !allDone && me.affiliate) setModalOpen(true);
  }, [me, allDone]);

  const dismissModal = () => {
    setStored(STORAGE_KEYS.modalDismissed, true);
    setModalOpen(false);
  };

  return (
    <>
      {!alreadyDone && me?.affiliate && (
        <div style={{ position: "sticky", top: 0, zIndex: 40, background: THEME.bg, borderBottom: `1px solid ${THEME.border}`, padding: "8px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 12, color: THEME.textMuted, fontWeight: 600 }}>Getting started</span>
            <div style={{ flex: 1, maxWidth: 200, height: 6, background: THEME.card, borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${progress * 100}%`, height: "100%", background: THEME.accent, borderRadius: 3, transition: "width 0.3s ease" }} />
            </div>
            <span style={{ fontSize: 11, color: THEME.textMuted }}>{completed}/{total}</span>
            {!modalOpen && (
              <button type="button" onClick={() => setModalOpen(true)} style={{ fontSize: 12, color: THEME.accent, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                Show checklist
              </button>
            )}
          </div>
        </div>
      )}

      {children}

      {modalOpen && me?.affiliate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24 }}>
          <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 16, padding: 28, maxWidth: 420, width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: THEME.text, margin: 0 }}>Get started</h2>
              <button type="button" onClick={dismissModal} style={{ background: "none", border: "none", color: THEME.textMuted, fontSize: 20, cursor: "pointer" }}>×</button>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {steps.map((s) => (
                <li key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${THEME.border}` }}>
                  <span style={{ fontSize: 18 }}>{s.done ? "✓" : "□"}</span>
                  <span style={{ flex: 1, color: s.done ? THEME.textMuted : THEME.text, fontSize: 14 }}>{s.label}</span>
                  {!s.done && s.href && (
                    s.href.startsWith("http") || s.href.startsWith("/api/") ? (
                      <a href={s.href} style={{ padding: "6px 12px", background: THEME.accent, color: "#fff", borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>Go →</a>
                    ) : (
                      <Link href={s.href} style={{ padding: "6px 12px", background: THEME.accent, color: "#fff", borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>Go →</Link>
                    )
                  )}
                </li>
              ))}
            </ul>
            <div style={{ marginTop: 16 }}>
              <button type="button" onClick={dismissModal} style={{ padding: "10px 16px", background: THEME.border, color: THEME.text, border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Dismiss</button>
            </div>
          </div>
        </div>
      )}

      {showCongrats && !congratsDone && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 101 }}>
          <div style={{ background: THEME.card, border: `2px solid ${THEME.success}`, borderRadius: 16, padding: 32, maxWidth: 360, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: THEME.text, marginBottom: 8 }}>You’re all set!</h2>
            <p style={{ color: THEME.textMuted, fontSize: 14, marginBottom: 24 }}>You’ve completed the onboarding checklist. Start sharing your links and growing your team.</p>
            <button type="button" onClick={() => { setShowCongrats(false); setCongratsDone(true); }} style={{ padding: "12px 24px", background: THEME.success, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700 }}>
              Continue
            </button>
          </div>
        </div>
      )}
    </>
  );
}
