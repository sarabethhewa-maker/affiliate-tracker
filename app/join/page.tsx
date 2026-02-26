"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

const HOW_DID_YOU_HEAR = [
  { value: "", label: "Select…" },
  { value: "Social Media", label: "Social Media" },
  { value: "Friend/Referral", label: "Friend/Referral" },
  { value: "Google", label: "Google" },
  { value: "Other", label: "Other" },
];

// Bio Longevity Labs brand: dark blue + light blue on white
const brand = {
  darkBlue: "#1e3a5f",
  lightBlue: "#3a7ca5",
  text: "#1a1a1a",
  textMuted: "#4a5568",
  border: "#e2e8f0",
  bg: "#f8fafc",
  white: "#ffffff",
};

const styles = {
  page: {
    minHeight: "100vh",
    background: brand.bg,
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    color: brand.text,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    background: brand.white,
    border: `1px solid ${brand.border}`,
    borderRadius: 16,
    padding: 32,
    width: "100%",
    maxWidth: 480,
    boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
  },
  logoWrap: {
    marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: 800, marginBottom: 8, color: brand.darkBlue },
  subtitle: { color: brand.textMuted, fontSize: 14, lineHeight: 1.6, marginBottom: 24 },
  label: {
    color: brand.textMuted,
    fontSize: 12,
    display: "block" as const,
    marginBottom: 6,
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  input: {
    width: "100%",
    background: brand.white,
    border: `1px solid ${brand.border}`,
    borderRadius: 8,
    padding: "12px 14px",
    color: brand.text,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box" as const,
  },
  select: {
    width: "100%",
    background: brand.white,
    border: `1px solid ${brand.border}`,
    borderRadius: 8,
    padding: "12px 14px",
    color: brand.text,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box" as const,
    cursor: "pointer",
  },
  checkboxRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 24,
  },
  checkbox: { marginTop: 4, cursor: "pointer", accentColor: brand.lightBlue },
  checkboxLabel: { color: brand.textMuted, fontSize: 13, lineHeight: 1.4 },
  button: {
    width: "100%",
    padding: "12px 0",
    background: `linear-gradient(135deg, ${brand.darkBlue}, ${brand.lightBlue})`,
    border: "none",
    borderRadius: 8,
    color: brand.white,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  success: { color: "#0d7a3d", fontSize: 15, marginTop: 20, textAlign: "center" as const, lineHeight: 1.5 },
  error: { color: "#b91c1c", fontSize: 13, marginTop: 12, textAlign: "center" as const },
};

export default function JoinPage() {
  const searchParams = useSearchParams();
  const refFromUrl = searchParams.get("ref") ?? "";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [socialHandle, setSocialHandle] = useState("");
  const [howDidYouHear, setHowDidYouHear] = useState("");
  const [referralCode, setReferralCode] = useState(refFromUrl);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => setReferralCode((c) => (refFromUrl ? refFromUrl : c)), [refFromUrl]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    if (!agreeToTerms) {
      setStatus("error");
      setMessage("You must agree to the affiliate terms and conditions.");
      return;
    }
    setStatus("loading");
    setMessage("");
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
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Something went wrong");
        return;
      }
      setStatus("success");
      setMessage(data.message || "Thanks! We'll review your application and be in touch within 48 hours.");
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  return (
    <div style={styles.page}>
      <style>{`* { box-sizing: border-box; } input, select { font-family: inherit; } input:focus, select:focus { border-color: ${brand.lightBlue}; box-shadow: 0 0 0 2px rgba(58,124,165,0.2); }`}</style>
      <div style={styles.card}>
        <div style={styles.logoWrap}>
          <Image src="/biolongevity-logo.png" alt="Bio Longevity Labs" width={220} height={56} priority style={{ width: "auto", height: 48, objectFit: "contain" }} />
        </div>
        <h1 style={styles.title}>Become an Affiliate</h1>
        <p style={styles.subtitle}>
          Join our affiliate program and earn commissions promoting the best peptides and bioregulators in the industry.
        </p>
        {status === "success" ? (
          <p style={styles.success}>{message}</p>
        ) : (
          <form onSubmit={submit}>
            <div style={{ marginBottom: 16 }}>
              <label style={styles.label}>Full name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={styles.input}
                placeholder="Your full name"
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={styles.label}>Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                placeholder="you@example.com"
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={styles.label}>Phone number (optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={styles.input}
                placeholder="+1 234 567 8900"
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={styles.label}>Instagram or social media handle (optional)</label>
              <input
                type="text"
                value={socialHandle}
                onChange={(e) => setSocialHandle(e.target.value)}
                style={styles.input}
                placeholder="@handle"
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={styles.label}>How did you hear about us?</label>
              <select
                value={howDidYouHear}
                onChange={(e) => setHowDidYouHear(e.target.value)}
                style={styles.select}
              >
                {HOW_DID_YOU_HEAR.map((o) => (
                  <option key={o.value || "empty"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={styles.label}>Referral code (optional)</label>
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                style={styles.input}
                placeholder="Recruiter's affiliate ID or code"
              />
            </div>
            <div style={styles.checkboxRow}>
              <input
                type="checkbox"
                id="terms"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                style={styles.checkbox}
              />
              <label htmlFor="terms" style={styles.checkboxLabel}>
                I agree to the affiliate terms and conditions
              </label>
            </div>
            <button type="submit" disabled={status === "loading"} style={styles.button}>
              {status === "loading" ? "Submitting…" : "Submit application"}
            </button>
          </form>
        )}
        {status === "error" && <p style={styles.error}>{message}</p>}
      </div>
    </div>
  );
}
