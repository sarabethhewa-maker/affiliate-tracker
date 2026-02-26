"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import QRCode from "react-qr-code";
import html2canvas from "html2canvas";
import { setOnboardingCopiedLink, setOnboardingVisitedLinks } from "../OnboardingChecklist";

const THEME = {
  bg: "#f8fafc",
  card: "#ffffff",
  border: "#e2e8f0",
  text: "#1a1a1a",
  textMuted: "#4a5568",
  accent: "#1e3a5f",
  accentLight: "#3a7ca5",
  success: "#0d7a3d",
};

type MeResponse = {
  pending?: boolean;
  affiliate?: { id: string; name: string; referralCode: string | null; slug: string | null; socialHandle?: string | null; couponCode?: string | null };
  tiers?: { name: string; commission: number }[];
  tierIndex?: number;
  commissionRate?: number;
};

function copyToClipboard(text: string, setCopied: (v: boolean) => void) {
  navigator.clipboard.writeText(text).then(() => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  });
}

export default function PortalLinksPage() {
  const searchParams = useSearchParams();
  const previewId = searchParams.get("preview");
  const [data, setData] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedTrack, setCopiedTrack] = useState(false);
  const [copiedRecruit, setCopiedRecruit] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [assetDownloading, setAssetDownloading] = useState(false);
  const [slugEditValue, setSlugEditValue] = useState("");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugSaving, setSlugSaving] = useState(false);
  const [slugSuccess, setSlugSuccess] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);

  const fetchMe = useCallback(async () => {
    const url = previewId ? `/api/me/affiliate?preview=${encodeURIComponent(previewId)}` : "/api/me/affiliate";
    const res = await fetch(url);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [previewId]);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    setOnboardingVisitedLinks();
  }, []);

  useEffect(() => {
    if (!slugEditValue.trim() || slugEditValue.length < 3) {
      setSlugAvailable(null);
      return;
    }
    const raw = slugEditValue.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 30);
    if (raw.length < 3) {
      setSlugAvailable(null);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/me/affiliate/slug/available?slug=${encodeURIComponent(raw)}`)
        .then((r) => r.json())
        .then((d) => setSlugAvailable(d.valid && d.available))
        .catch(() => setSlugAvailable(null));
    }, 300);
    return () => clearTimeout(t);
  }, [slugEditValue]);

  const trackingLinkFromAff = (aff: { id: string; slug?: string | null }) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return aff.slug ? `${origin}/ref/${aff.slug}` : `${origin}/api/ref/${aff.id}`;
  };
  const downloadQR = useCallback(() => {
    const trackingLink = data?.affiliate ? trackingLinkFromAff(data.affiliate) : "";
    if (!trackingLink || !qrRef.current) return;
    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const a = document.createElement("a");
      a.download = "affiliate-tracking-qr.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }, [data?.affiliate]);

  const downloadShareCard = useCallback(async () => {
    if (!shareCardRef.current) return;
    setAssetDownloading(true);
    try {
      const canvas = await html2canvas(shareCardRef.current, { scale: 2, useCORS: true, backgroundColor: "#f8fafc" });
      const a = document.createElement("a");
      a.download = "biolongevitylabs-affiliate-card.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
    } finally {
      setAssetDownloading(false);
    }
  }, []);

  if (loading) return <div style={{ padding: 48, color: THEME.textMuted }}>Loading…</div>;
  if (data?.pending || !data?.affiliate) {
    return (
      <div style={{ padding: 24, color: THEME.textMuted }}>Your account is pending approval.</div>
    );
  }

  const aff = data.affiliate;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const trackingLink = trackingLinkFromAff(aff);
  const recruitLink = aff.referralCode ? `${origin}/join?ref=${aff.referralCode}` : null;
  const first = aff.name.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z0-9]/g, "") || "me";
  const full = aff.name.trim().split(/\s+/).map((p) => (p as string).toLowerCase().replace(/[^a-z0-9]/g, "")).filter(Boolean).join("-") || "me";
  const handle = aff.socialHandle ? aff.socialHandle.replace(/^@/, "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 30) : "";
  const slugSuggestions = [first, full, ...(handle.length >= 3 ? [handle] : [])].filter((s, i, arr) => s.length >= 3 && arr.indexOf(s) === i);
  const tierName = data.tiers?.[data.tierIndex ?? 0]?.name ?? "Affiliate";
  const commissionPct = data.commissionRate ?? 10;
  const shareCaption = `I partner with @biolongevitylabs and earn commission on every sale 💊 Use my link to shop and join my team: ${trackingLink} #peptides #biohacking`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: THEME.text }}>My Links</h1>

      <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: THEME.text }}>Tracking link</h2>
        {aff.couponCode ? (
          <p style={{ color: THEME.textMuted, fontSize: 14, marginBottom: 12 }}>Share your link <strong style={{ color: THEME.text }}>or</strong> your coupon code <strong style={{ color: THEME.accent, fontFamily: "monospace" }}>{aff.couponCode}</strong> — either way you get credited!</p>
        ) : (
          <p style={{ color: THEME.textMuted, fontSize: 14, marginBottom: 12 }}>Share this link with customers. When they click and buy, you get credit.</p>
        )}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
          <code style={{ flex: 1, minWidth: 200, padding: "10px 12px", background: THEME.bg, borderRadius: 8, fontSize: 13, wordBreak: "break-all" }}>{trackingLink}</code>
          <button type="button" onClick={() => { copyToClipboard(trackingLink, setCopiedTrack); setOnboardingCopiedLink(); }} style={{ padding: "10px 16px", background: copiedTrack ? THEME.success : THEME.accent, color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
            {copiedTrack ? "Copied" : "Copy"}
          </button>
        </div>
        <div style={{ marginTop: 24, paddingTop: 24, borderTop: `1px solid ${THEME.border}` }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: THEME.text }}>Customize your link</h3>
          <p style={{ fontSize: 13, color: THEME.textMuted, marginBottom: 12 }}>Change the last part of your link (e.g. /ref/<strong style={{ color: THEME.text }}>yourname</strong>). Only lowercase letters, numbers, and hyphens; 3–30 characters.</p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            <span style={{ color: THEME.textMuted, fontSize: 13 }}>{origin}/ref/</span>
            <input
              value={slugEditValue || (aff.slug ?? "")}
              onChange={(e) => setSlugEditValue(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 30))}
              placeholder="yourname"
              style={{ width: 140, padding: "8px 10px", fontSize: 13, fontFamily: "monospace", border: `1px solid ${THEME.border}`, borderRadius: 8, background: THEME.bg }}
            />
            {(slugEditValue || aff.slug) && (slugEditValue || aff.slug)!.length >= 3 && (slugAvailable === true || (slugEditValue || aff.slug) === (aff.slug ?? "")) && <span style={{ color: THEME.success }} title="Available">✓</span>}
            {(slugEditValue || aff.slug) && (slugEditValue || aff.slug)!.length >= 3 && slugAvailable === false && <span style={{ color: "#b91c1c" }} title="Taken">✗</span>}
            <button
              type="button"
              disabled={slugSaving || (() => {
                const raw = (slugEditValue || (aff.slug ?? "")).trim();
                if (raw.length < 3) return true;
                if (raw === (aff.slug ?? "")) return false;
                return slugAvailable !== true;
              })()}
              onClick={async () => {
                const raw = (slugEditValue || (aff.slug ?? "")).trim().toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 30);
                if (raw.length < 3) return;
                setSlugSaving(true);
                setSlugSuccess(false);
                try {
                  const res = await fetch("/api/me/affiliate/slug", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: raw }) });
                  if (res.ok) {
                    setSlugSuccess(true);
                    setTimeout(() => setSlugSuccess(false), 5000);
                    fetchMe();
                  }
                } finally {
                  setSlugSaving(false);
                }
              }}
              style={{ padding: "8px 16px", background: THEME.accent, color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}
            >
              {slugSaving ? "Saving…" : "Save"}
            </button>
          </div>
          {slugSuggestions.length > 0 && (
            <p style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 6 }}>Suggestions:</p>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {slugSuggestions.map((s) => (
              <button key={s} type="button" onClick={() => setSlugEditValue(s)} style={{ padding: "4px 10px", background: THEME.bg, border: `1px solid ${THEME.border}`, borderRadius: 6, fontSize: 12, cursor: "pointer", color: THEME.accent }}>{s}</button>
            ))}
          </div>
          {slugSuccess && (
            <p style={{ fontSize: 13, color: THEME.success, marginBottom: 8 }}>Your link has been updated! Make sure to update any places you&apos;ve already shared your old link.</p>
          )}
          <p style={{ fontSize: 12, color: THEME.textMuted }}>Changing your link will break any existing shares. Your old link will stop working.</p>
        </div>
        <div style={{ marginTop: 24 }}>
          <p style={{ fontSize: 14, color: THEME.textMuted, marginBottom: 12 }}>QR code — scan or download for events and print materials.</p>
          <div ref={qrRef} style={{ background: "#fff", padding: 16, borderRadius: 12, display: "inline-block" }}>
            <QRCode value={trackingLink} size={200} level="M" />
          </div>
          <div style={{ marginTop: 12 }}>
            <button type="button" onClick={downloadQR} style={{ padding: "10px 20px", background: THEME.accent, color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
              Download QR code (PNG)
            </button>
          </div>
        </div>
      </div>

      {recruitLink && (
        <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: THEME.text }}>Recruit link</h2>
          <p style={{ color: THEME.textMuted, fontSize: 14, marginBottom: 12 }}>Share with people who want to join as affiliates. They’ll be linked to your team.</p>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <code style={{ flex: 1, minWidth: 200, padding: "10px 12px", background: THEME.bg, borderRadius: 8, fontSize: 13, wordBreak: "break-all" }}>{recruitLink}</code>
            <button type="button" onClick={() => copyToClipboard(recruitLink, setCopiedRecruit)} style={{ padding: "10px 16px", background: copiedRecruit ? THEME.success : THEME.accent, color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
              {copiedRecruit ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {/* Get Shareable Assets */}
      <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: THEME.text }}>Get shareable assets</h2>
        <p style={{ color: THEME.textMuted, fontSize: 14, marginBottom: 16 }}>Download a branded card to screenshot and share, or copy the caption below.</p>
        <div
          ref={shareCardRef}
          style={{
            background: THEME.bg,
            border: `2px solid ${THEME.border}`,
            borderRadius: 16,
            padding: 28,
            maxWidth: 380,
            color: THEME.text,
          }}
        >
          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, color: THEME.text }}>Join my team at Biolongevity Labs</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: THEME.accent, color: THEME.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800 }}>{aff.name.charAt(0)}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{aff.name}</div>
              <span style={{ fontSize: 12, color: THEME.accent, fontWeight: 600, textTransform: "uppercase" }}>{tierName}</span>
            </div>
          </div>
          <div style={{ background: "#fff", padding: 12, borderRadius: 8, display: "inline-block", marginBottom: 16 }}>
            <QRCode value={trackingLink} size={120} level="M" />
          </div>
          <div style={{ fontSize: 12, color: THEME.textMuted, wordBreak: "break-all", marginBottom: 8 }}>{trackingLink}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: THEME.accent }}>Earn {commissionPct}% commission on every sale</div>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
          <button type="button" onClick={downloadShareCard} disabled={assetDownloading} style={{ padding: "10px 20px", background: assetDownloading ? THEME.border : THEME.accent, color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: assetDownloading ? "not-allowed" : "pointer", fontSize: 14 }}>
            {assetDownloading ? "Generating…" : "Download image"}
          </button>
          <button type="button" onClick={() => { copyToClipboard(shareCaption, setCopiedCaption); }} style={{ padding: "10px 20px", background: copiedCaption ? THEME.success : THEME.card, color: copiedCaption ? "#fff" : THEME.text, border: `1px solid ${THEME.border}`, borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
            {copiedCaption ? "Copied caption!" : "Copy caption"}
          </button>
        </div>
      </div>
    </div>
  );
}
