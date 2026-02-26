"use client";

import { useState, useCallback, useEffect } from "react";

const THEME = {
  bg: "#f8f9fa",
  card: "#ffffff",
  border: "#e2e8f0",
  text: "#1a1a2e",
  textMuted: "#4a5568",
  accent: "#1a4a8a",
  success: "#38a169",
  error: "#b91c1c",
};

const CATEGORIES = [
  "email",
  "social-instagram",
  "social-facebook",
  "social-tiktok",
  "social-twitter",
  "text-message",
  "other",
] as const;

const SAMPLE = {
  affiliate_name: "Jane Doe",
  tracking_link: "https://example.com/ref/jane",
  coupon_code: "Use code JANE15 for a discount!",
};

function fillPreview(text: string): string {
  return text
    .replace(/\{\{affiliate_name\}\}/g, SAMPLE.affiliate_name)
    .replace(/\{\{tracking_link\}\}/g, SAMPLE.tracking_link)
    .replace(/\{\{coupon_code\}\}/g, SAMPLE.coupon_code);
}

type Template = {
  id: string;
  title: string;
  category: string;
  subject: string | null;
  body: string;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function MessageTemplatesTab() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | Template | null>(null);
  const [form, setForm] = useState({ title: "", category: "email", subject: "", body: "", sortOrder: 0, active: true });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Template | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/message-templates");
      const data = await res.json();
      setTemplates(Array.isArray(data) ? data : []);
    } catch {
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const openCreate = () => {
    setForm({ title: "", category: "email", subject: "", body: "", sortOrder: templates.length, active: true });
    setModal("create");
  };

  const openEdit = (t: Template) => {
    setForm({
      title: t.title,
      category: t.category,
      subject: t.subject ?? "",
      body: t.body,
      sortOrder: t.sortOrder,
      active: t.active,
    });
    setModal(t);
  };

  const save = async () => {
    if (!form.title.trim() || !form.body.trim()) return;
    setSaving(true);
    try {
      if (modal === "create") {
        await fetch("/api/message-templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title.trim(),
            category: form.category,
            subject: form.subject.trim() || null,
            body: form.body.trim(),
            sortOrder: form.sortOrder,
            active: form.active,
          }),
        });
      } else if (modal && typeof modal === "object") {
        await fetch("/api/message-templates/" + modal.id, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title.trim(),
            category: form.category,
            subject: form.subject.trim() || null,
            body: form.body.trim(),
            sortOrder: form.sortOrder,
            active: form.active,
          }),
        });
      }
      setModal(null);
      fetchTemplates();
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async (t: Template) => {
    try {
      await fetch("/api/message-templates/" + t.id, { method: "DELETE" });
      setDeleteConfirm(null);
      fetchTemplates();
    } catch {
      // ignore
    }
  };

  const byCategory = templates.reduce((acc, t) => {
    const c = t.category || "other";
    if (!acc[c]) acc[c] = [];
    acc[c].push(t);
    return acc;
  }, {} as Record<string, Template[]>);

  const categoryLabels: Record<string, string> = {
    email: "Email",
    "social-instagram": "Instagram",
    "social-facebook": "Facebook",
    "social-tiktok": "TikTok",
    "social-twitter": "Twitter",
    "text-message": "Text Message",
    other: "Other",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: THEME.text, margin: 0 }}>Message Templates</h2>
        <button
          type="button"
          onClick={openCreate}
          style={{ padding: "10px 18px", background: THEME.accent, color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
        >
          Add template
        </button>
      </div>
      <p style={{ color: THEME.textMuted, fontSize: 13, margin: 0 }}>
        Affiliates see these in the portal under Templates. Use placeholders: {"{{affiliate_name}}"}, {"{{tracking_link}}"}, {"{{coupon_code}}"}.
      </p>

      {loading ? (
        <div style={{ color: THEME.textMuted }}>Loading…</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {CATEGORIES.filter((c) => (byCategory[c]?.length ?? 0) > 0).map((cat) => (
            <div key={cat} style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${THEME.border}`, fontWeight: 700, fontSize: 13, color: THEME.text }}>
                {categoryLabels[cat] ?? cat}
              </div>
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {(byCategory[cat] ?? []).sort((a, b) => a.sortOrder - b.sortOrder).map((t) => (
                  <li key={t.id} style={{ borderBottom: `1px solid ${THEME.border}`, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: THEME.text, marginBottom: 4 }}>{t.title}</div>
                      {!t.active && <span style={{ fontSize: 11, color: THEME.textMuted, marginLeft: 8 }}>Inactive</span>}
                      <div style={{ fontSize: 12, color: THEME.textMuted, whiteSpace: "pre-wrap", maxHeight: 60, overflow: "hidden" }}>{t.body.slice(0, 120)}{t.body.length > 120 ? "…" : ""}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button type="button" onClick={() => openEdit(t)} style={{ padding: "6px 12px", background: THEME.bg, border: `1px solid ${THEME.border}`, borderRadius: 6, fontSize: 12, cursor: "pointer", color: THEME.text }}>Edit</button>
                      <button type="button" onClick={() => setDeleteConfirm(t)} style={{ padding: "6px 12px", background: "#fee2e2", border: "1px solid #b91c1c", borderRadius: 6, fontSize: 12, cursor: "pointer", color: THEME.error }}>Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {templates.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: THEME.textMuted, background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12 }}>
              No templates yet. Add one to get started.
            </div>
          )}
        </div>
      )}

      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24 }} onClick={() => setModal(null)}>
          <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 16, padding: 24, width: "100%", maxWidth: 560, maxHeight: "90vh", overflow: "auto" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: 16, fontSize: 18, fontWeight: 700, color: THEME.text }}>{modal === "create" ? "New template" : "Edit template"}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: THEME.textMuted }}>Title</label>
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} style={{ padding: "10px 12px", border: `1px solid ${THEME.border}`, borderRadius: 8, fontSize: 14 }} placeholder="e.g. Introduction Email" />
              <label style={{ fontSize: 12, fontWeight: 600, color: THEME.textMuted }}>Category</label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} style={{ padding: "10px 12px", border: `1px solid ${THEME.border}`, borderRadius: 8, fontSize: 14 }}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{categoryLabels[c] ?? c}</option>
                ))}
              </select>
              {form.category === "email" && (
                <>
                  <label style={{ fontSize: 12, fontWeight: 600, color: THEME.textMuted }}>Subject (email)</label>
                  <input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} style={{ padding: "10px 12px", border: `1px solid ${THEME.border}`, borderRadius: 8, fontSize: 14 }} placeholder="Email subject line" />
                </>
              )}
              <label style={{ fontSize: 12, fontWeight: 600, color: THEME.textMuted }}>Body</label>
              <textarea value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} rows={8} style={{ padding: "10px 12px", border: `1px solid ${THEME.border}`, borderRadius: 8, fontSize: 14, resize: "vertical" }} placeholder="Use {{affiliate_name}}, {{tracking_link}}, {{coupon_code}}" />
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
                Active (visible to affiliates)
              </label>
              <div style={{ marginTop: 8, padding: 12, background: THEME.bg, borderRadius: 8, fontSize: 12, color: THEME.textMuted }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Preview (sample data)</div>
                <div style={{ whiteSpace: "pre-wrap", color: THEME.text }}>{fillPreview(form.body)}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 20 }}>
              <button type="button" onClick={() => setModal(null)} style={{ padding: "10px 18px", background: THEME.bg, border: `1px solid ${THEME.border}`, borderRadius: 8, cursor: "pointer" }}>Cancel</button>
              <button type="button" onClick={save} disabled={saving} style={{ padding: "10px 18px", background: THEME.accent, color: "#fff", border: "none", borderRadius: 8, cursor: saving ? "not-allowed" : "pointer", fontWeight: 600 }}>{saving ? "Saving…" : "Save"}</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 101 }} onClick={() => setDeleteConfirm(null)}>
          <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 16, padding: 24, maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <p style={{ marginBottom: 16 }}>Delete &quot;{deleteConfirm.title}&quot;? This cannot be undone.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setDeleteConfirm(null)} style={{ padding: "8px 16px", background: THEME.bg, border: `1px solid ${THEME.border}`, borderRadius: 8, cursor: "pointer" }}>Cancel</button>
              <button type="button" onClick={() => deleteTemplate(deleteConfirm)} style={{ padding: "8px 16px", background: THEME.error, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
