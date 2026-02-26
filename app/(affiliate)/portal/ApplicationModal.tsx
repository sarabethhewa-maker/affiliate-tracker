"use client";

import { useState } from "react";

const THEME = {
  bg: "#ffffff",
  inputBg: "#f8f9fa",
  border: "#e2e8f0",
  text: "#1a1a2e",
  textMuted: "#4a5568",
  accent: "#1a4a8a",
  gold: "#f0c040",
  success: "#38a169",
};

const HOW_DID_YOU_HEAR = [
  "Social Media",
  "Friend/Referral",
  "Google",
  "Existing Affiliate",
  "Other",
] as const;

const AFFILIATE_AGREEMENT = `Bio Longevity Labs Affiliate Program Terms

1. Enrollment. By applying, you agree to promote Bio Longevity Labs products in accordance with these terms and our brand guidelines.

2. Commission. You will earn commission on qualified sales at the rate assigned to your tier. Commission is paid on approved conversions according to our payout schedule.

3. Compliance. You will not make false or misleading claims, use spam, or violate any applicable laws. We may revoke your status at any time for breach.

4. Relationship. You are an independent affiliate, not an employee. You are responsible for your own taxes and reporting.

5. Modifications. We may update these terms; continued participation constitutes acceptance.

By submitting, you confirm that you have read and agree to these terms.`;

type Props = {
  onClose: () => void;
  onSuccess: () => void;
  prefilledEmail?: string;
};

export default function ApplicationModal({ onClose, onSuccess, prefilledEmail = "" }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState(prefilledEmail);
  const [phone, setPhone] = useState("");
  const [socialHandle, setSocialHandle] = useState("");
  const [howDidYouHear, setHowDidYouHear] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim()) {
      setError("Full name and email are required.");
      return;
    }
    if (!agreeToTerms) {
      setError("You must agree to the affiliate terms and conditions.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/affiliates/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          socialHandle: socialHandle.trim() || undefined,
          howDidYouHear: howDidYouHear || undefined,
          referralCode: referralCode.trim() || undefined,
          agreeToTerms: true,
        }),
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    }
    setSubmitting(false);
  };

  if (success) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 24 }}>
        <div style={{ background: THEME.bg, borderRadius: 16, padding: 40, maxWidth: 440, width: "100%", textAlign: "center", boxShadow: "0 20px 40px rgba(0,0,0,0.12)" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: THEME.text, marginBottom: 12 }}>Application submitted!</h2>
          <p style={{ color: THEME.textMuted, fontSize: 15, lineHeight: 1.5, marginBottom: 24 }}>
            We&apos;ll review it and get back to you within 48 hours.
          </p>
          <button
            type="button"
            onClick={() => { onSuccess(); onClose(); }}
            style={{ padding: "12px 24px", background: THEME.accent, color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" }}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 24 }} onClick={onClose}>
      <div style={{ background: THEME.bg, borderRadius: 16, maxWidth: 520, width: "100%", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 20px 40px rgba(0,0,0,0.12)" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "24px 28px", borderBottom: `1px solid ${THEME.border}` }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: THEME.text, margin: 0 }}>Apply to the Affiliate Program</h2>
        </div>
        <form id="apply-form" onSubmit={handleSubmit} style={{ padding: "24px 28px", overflowY: "auto", flex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: THEME.text, marginBottom: 6 }}>Full name *</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe"
                style={{ width: "100%", padding: "10px 14px", background: THEME.inputBg, border: `1px solid ${THEME.border}`, borderRadius: 8, fontSize: 14, color: THEME.text, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: THEME.text, marginBottom: 6 }}>Email *</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com"
                style={{ width: "100%", padding: "10px 14px", background: THEME.inputBg, border: `1px solid ${THEME.border}`, borderRadius: 8, fontSize: 14, color: THEME.text, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: THEME.text, marginBottom: 6 }}>Phone number</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 123-4567"
                style={{ width: "100%", padding: "10px 14px", background: THEME.inputBg, border: `1px solid ${THEME.border}`, borderRadius: 8, fontSize: 14, color: THEME.text, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: THEME.text, marginBottom: 6 }}>Instagram or TikTok handle</label>
              <input type="text" value={socialHandle} onChange={e => setSocialHandle(e.target.value)} placeholder="@username"
                style={{ width: "100%", padding: "10px 14px", background: THEME.inputBg, border: `1px solid ${THEME.border}`, borderRadius: 8, fontSize: 14, color: THEME.text, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: THEME.text, marginBottom: 6 }}>How did you hear about us?</label>
              <select value={howDidYouHear} onChange={e => setHowDidYouHear(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", background: THEME.inputBg, border: `1px solid ${THEME.border}`, borderRadius: 8, fontSize: 14, color: THEME.text, boxSizing: "border-box" }}>
                <option value="">Select...</option>
                {HOW_DID_YOU_HEAR.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: THEME.text, marginBottom: 6 }}>Were you referred by an existing affiliate? Enter their code here</label>
              <input type="text" value={referralCode} onChange={e => setReferralCode(e.target.value)} placeholder="e.g. ABC123"
                style={{ width: "100%", padding: "10px 14px", background: THEME.inputBg, border: `1px solid ${THEME.border}`, borderRadius: 8, fontSize: 14, color: THEME.text, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: THEME.text, marginBottom: 6 }}>Affiliate agreement</label>
              <div style={{ maxHeight: 140, overflowY: "auto", padding: 12, background: THEME.inputBg, border: `1px solid ${THEME.border}`, borderRadius: 8, fontSize: 12, color: THEME.textMuted, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                {AFFILIATE_AGREEMENT}
              </div>
            </div>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
              <input type="checkbox" checked={agreeToTerms} onChange={e => setAgreeToTerms(e.target.checked)} style={{ marginTop: 4 }} />
              <span style={{ fontSize: 13, color: THEME.text }}>I agree to the affiliate terms and conditions *</span>
            </label>
            {error && <p style={{ color: "#b91c1c", fontSize: 13 }}>{error}</p>}
          </div>
        </form>
        <div style={{ padding: "16px 28px 24px", borderTop: `1px solid ${THEME.border}`, display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button type="button" onClick={onClose} style={{ padding: "10px 20px", background: THEME.inputBg, color: THEME.text, border: `1px solid ${THEME.border}`, borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Cancel
          </button>
          <button type="submit" form="apply-form" disabled={submitting} style={{ padding: "10px 20px", background: THEME.accent, color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.8 : 1 }}>
            {submitting ? "Submitting…" : "Submit Application"}
          </button>
        </div>
      </div>
    </div>
  );
}
