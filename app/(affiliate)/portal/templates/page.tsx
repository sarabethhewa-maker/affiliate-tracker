"use client";

import { useState, useEffect, useCallback } from "react";

const THEME = {
  bg: "#f8f9fa",
  card: "#ffffff",
  border: "#e2e8f0",
  text: "#1a1a2e",
  textMuted: "#4a5568",
  accent: "#1a4a8a",
  success: "#38a169",
};

const CATEGORY_TABS = [
  { id: "email", label: "Email" },
  { id: "social-instagram", label: "Instagram" },
  { id: "social-facebook", label: "Facebook" },
  { id: "social-tiktok", label: "TikTok" },
  { id: "social-twitter", label: "Twitter" },
  { id: "text-message", label: "Text Message" },
  { id: "other", label: "Other" },
] as const;

type FilledTemplate = {
  id: string;
  title: string;
  category: string;
  subject: string | null;
  body: string;
};

function copyToClipboard(text: string, setCopied: (v: boolean) => void) {
  navigator.clipboard.writeText(text).then(() => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  });
}

export default function PortalTemplatesPage() {
  const [templates, setTemplates] = useState<FilledTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("email");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedSubjectId, setCopiedSubjectId] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/affiliate/templates");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not load templates");
        setTemplates([]);
        return;
      }
      const data = await res.json();
      setTemplates(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0 && !data.some((t: FilledTemplate) => t.category === category)) {
        setCategory(data[0].category || "email");
      }
    } catch {
      setError("Failed to load templates");
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const filtered = templates.filter((t) => t.category === category);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: THEME.text, marginBottom: 8 }}>Swipe Copy</h1>
      <p style={{ color: THEME.textMuted, fontSize: 14, marginBottom: 24 }}>
        Pre-written templates with your name, link, and code already filled in. Copy and customize for your audience.
      </p>

      {loading ? (
        <div style={{ color: THEME.textMuted }}>Loading templates…</div>
      ) : error ? (
        <div style={{ padding: 20, background: "#fee2e2", border: "1px solid #b91c1c", borderRadius: 12, color: "#b91c1c" }}>{error}</div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
            {CATEGORY_TABS.map((tab) => {
              const count = templates.filter((t) => t.category === tab.id).length;
              if (count === 0) return null;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCategory(tab.id)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: `1px solid ${category === tab.id ? THEME.accent : THEME.border}`,
                    background: category === tab.id ? "#e0f2fe" : THEME.card,
                    color: category === tab.id ? THEME.accent : THEME.text,
                    fontSize: 13,
                    fontWeight: category === tab.id ? 600 : 400,
                    cursor: "pointer",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: THEME.textMuted, background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12 }}>
                No templates in this category.
              </div>
            ) : (
              filtered.map((t) => (
                <div key={t.id} style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: THEME.text, marginBottom: 12 }}>{t.title}</div>
                  {t.subject != null && t.subject !== "" && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: THEME.textMuted, textTransform: "uppercase", marginBottom: 4 }}>Subject</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ flex: 1, minWidth: 0, fontSize: 14, color: THEME.text }}>{t.subject}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(t.subject!, (v) => setCopiedSubjectId(v ? t.id : null))}
                          style={{ padding: "6px 12px", background: THEME.accent, color: "#fff", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600 }}
                        >
                          {copiedSubjectId === t.id ? "Copied!" : "Copy subject"}
                        </button>
                      </div>
                    </div>
                  )}
                  <div style={{ fontSize: 11, fontWeight: 600, color: THEME.textMuted, textTransform: "uppercase", marginBottom: 4 }}>Body</div>
                  <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 14, color: THEME.text, margin: "0 0 12px 0", padding: 12, background: THEME.bg, borderRadius: 8, border: `1px solid ${THEME.border}` }}>{t.body}</pre>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(t.body, (v) => setCopiedId(v ? t.id : null))}
                    style={{ padding: "8px 16px", background: THEME.accent, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: 600 }}
                  >
                    {copiedId === t.id ? "Copied to clipboard!" : "Copy to clipboard"}
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
