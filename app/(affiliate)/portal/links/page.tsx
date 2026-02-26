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
  affiliate?: { id: string; name: string; referralCode: string | null };
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

  const downloadQR = useCallback(() => {
    const trackingLink = typeof window !== "undefined" ? `${window.location.origin}/api/ref/${data?.affiliate?.id}` : "";
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
  }, [data?.affiliate?.id]);

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
  const trackingLink = `${origin}/api/ref/${aff.id}`;
  const recruitLink = aff.referralCode ? `${origin}/join?ref=${aff.referralCode}` : null;
  const tierName = data.tiers?.[data.tierIndex ?? 0]?.name ?? "Affiliate";
  const commissionPct = data.commissionRate ?? 10;
  const shareCaption = `I partner with @biolongevitylabs and earn commission on every sale 💊 Use my link to shop and join my team: ${trackingLink} #peptides #biohacking`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: THEME.text }}>My Links</h1>

      <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: THEME.text }}>Tracking link</h2>
        <p style={{ color: THEME.textMuted, fontSize: 14, marginBottom: 12 }}>Share this link with customers. When they click and buy, you get credit.</p>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
          <code style={{ flex: 1, minWidth: 200, padding: "10px 12px", background: THEME.bg, borderRadius: 8, fontSize: 13, wordBreak: "break-all" }}>{trackingLink}</code>
          <button type="button" onClick={() => { copyToClipboard(trackingLink, setCopiedTrack); setOnboardingCopiedLink(); }} style={{ padding: "10px 16px", background: copiedTrack ? THEME.success : THEME.accent, color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
            {copiedTrack ? "Copied" : "Copy"}
          </button>
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
          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, color: THEME.text }}>Join my team at Bio Longevity Labs</h3>
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
