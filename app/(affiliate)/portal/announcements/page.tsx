"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const THEME = {
  bg: "var(--theme-bg)",
  card: "var(--theme-card)",
  border: "var(--theme-border)",
  text: "var(--theme-text)",
  textMuted: "var(--theme-text-muted)",
  accent: "var(--theme-accent)",
  success: "var(--theme-success)",
};

type Comment = { affiliateId: string; affiliateName: string; text: string; createdAt: string };

type Announcement = {
  id: string;
  title: string;
  content: string;
  priority: string;
  pinned: boolean;
  publishedAt: string;
  expiresAt: string | null;
  authorName?: string | null;
  authorImageUrl?: string | null;
  likedByAffiliateIds?: string[] | null;
  comments?: Comment[] | null;
};

export default function PortalAnnouncementsPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [affiliateId, setAffiliateId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [posting, setPosting] = useState<Record<string, boolean>>({});
  const [commentError, setCommentError] = useState<Record<string, string>>({});
  const [emptyCommentTouched, setEmptyCommentTouched] = useState<Record<string, boolean>>({});
  const [liking, setLiking] = useState<Record<string, boolean>>({});

  const fetchAnnouncements = useCallback(async () => {
    const r = await fetch("/api/announcements");
    if (r.status === 401 || r.status === 403) {
      router.replace("/portal");
      return;
    }
    if (r.ok) {
      const list = await r.json();
      setAnnouncements(Array.isArray(list) ? list : []);
    }
  }, [router]);

  const [affiliateName, setAffiliateName] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/me/affiliate")
      .then((r) => r.json())
      .then((data) => {
        setAffiliateId(data?.affiliate?.id ?? null);
        setAffiliateName(data?.affiliate?.name ?? null);
      })
      .catch(() => {
        setAffiliateId(null);
        setAffiliateName(null);
      });
  }, []);

  useEffect(() => {
    fetchAnnouncements()
      .catch(() => setAnnouncements([]))
      .finally(() => setLoading(false));
  }, [fetchAnnouncements]);

  const toggleLike = async (id: string) => {
    if (liking[id]) return;
    setLiking((p) => ({ ...p, [id]: true }));
    try {
      const r = await fetch(`/api/announcements/${id}/like`, { method: "POST" });
      if (r.ok) await fetchAnnouncements();
    } finally {
      setLiking((p) => ({ ...p, [id]: false }));
    }
  };

  const postComment = async (id: string) => {
    const text = (commentText[id] ?? "").trim();
    if (posting[id]) return;
    if (!text) {
      setEmptyCommentTouched((p) => ({ ...p, [id]: true }));
      setCommentError((p) => ({ ...p, [id]: "Please enter a comment." }));
      return;
    }
    setEmptyCommentTouched((p) => ({ ...p, [id]: false }));
    setCommentError((p) => ({ ...p, [id]: "" }));
    setPosting((p) => ({ ...p, [id]: true }));
    try {
      const r = await fetch(`/api/announcements/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          ...(affiliateId && affiliateName ? { affiliateId, affiliateName } : {}),
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok) {
        setCommentText((p) => ({ ...p, [id]: "" }));
        setCommentError((p) => ({ ...p, [id]: "" }));
        await fetchAnnouncements();
      } else {
        const msg = (data?.error as string) || "Failed to post comment";
        console.error("[Comment POST failed]", r.status, r.statusText, data);
        setCommentError((p) => ({ ...p, [id]: msg }));
      }
    } catch (err) {
      console.error("[Comment POST error]", err);
      setCommentError((p) => ({ ...p, [id]: "Failed to post comment" }));
    } finally {
      setPosting((p) => ({ ...p, [id]: false }));
    }
  };

  const now = new Date();
  const isExpired = (a: Announcement) => a.expiresAt != null && new Date(a.expiresAt) <= now;

  if (loading) {
    return (
      <div style={{ padding: 48, color: THEME.textMuted }}>Loading…</div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/portal/dashboard" style={{ color: THEME.textMuted, fontSize: 13, textDecoration: "none" }}>← Dashboard</Link>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: THEME.text, margin: 0 }}>Announcements</h1>
      </div>

      {announcements.length === 0 ? (
        <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 48, textAlign: "center", color: THEME.textMuted }}>
          No announcements yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {announcements.map((a) => {
            const expired = isExpired(a);
            const borderColor = expired ? "#94a3b8" : a.priority === "urgent" ? "#b91c1c" : a.priority === "important" ? "#b45309" : "#e2e8f0";
            const likes = Array.isArray(a.likedByAffiliateIds) ? a.likedByAffiliateIds : [];
            const liked = affiliateId ? likes.includes(affiliateId) : false;
            const comments = Array.isArray(a.comments) ? a.comments : [];
            const sortedComments = [...comments].sort(
              (x, y) => new Date(x.createdAt).getTime() - new Date(y.createdAt).getTime()
            );
            return (
              <div
                key={a.id}
                style={{
                  background: THEME.card,
                  border: `1px solid ${THEME.border}`,
                  borderLeft: `4px solid ${borderColor}`,
                  borderRadius: 12,
                  padding: 24,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  opacity: expired ? 0.6 : 1,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: 18, color: THEME.text }}>{a.title}</span>
                  {a.pinned && <span style={{ fontSize: 14 }} title="Pinned">📌</span>}
                  {expired ? (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 6px", borderRadius: 4, background: "#e2e8f0", color: "#64748b" }}>Expired</span>
                  ) : a.priority !== "normal" ? (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: a.priority === "urgent" ? "#fee2e2" : "#fef3c7",
                        color: a.priority === "urgent" ? "#b91c1c" : "#b45309",
                      }}
                    >
                      {a.priority === "urgent" ? "Urgent" : "Important"}
                    </span>
                  ) : null}
                </div>
                <p style={{ color: THEME.textMuted, fontSize: 14, margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{a.content}</p>
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: THEME.border, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: THEME.textMuted }}>
                    {a.authorImageUrl ? (
                      <img src={a.authorImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span>{(a.authorName || "A").charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <span style={{ fontSize: 12, color: THEME.textMuted }}>
                    Posted by {a.authorName || "Admin"}
                    {" · "}
                    {new Date(a.publishedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                  </span>
                </div>

                <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${THEME.border}` }}>
                  <button
                    type="button"
                    onClick={() => toggleLike(a.id)}
                    disabled={liking[a.id]}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: liking[a.id] ? "wait" : "pointer",
                      padding: "4px 0",
                      fontSize: 14,
                      color: liked ? "#b91c1c" : THEME.textMuted,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>{liked ? "❤️" : "🤍"}</span>
                    <span>{likes.length}</span>
                  </button>
                </div>

                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: THEME.text, marginBottom: 8 }}>Comments</div>
                  {sortedComments.length === 0 ? (
                    <p style={{ fontSize: 13, color: THEME.textMuted, margin: "0 0 12px 0" }}>No comments yet.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
                      {sortedComments.map((c) => (
                        <div key={`${c.affiliateId}-${c.createdAt}`} style={{ padding: 10, background: THEME.bg, borderRadius: 8, border: `1px solid ${THEME.border}` }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: THEME.text, marginBottom: 4 }}>{c.affiliateName}</div>
                          <p style={{ fontSize: 13, color: THEME.textMuted, margin: 0, whiteSpace: "pre-wrap" }}>{c.text}</p>
                          <div style={{ fontSize: 11, color: THEME.textMuted, marginTop: 4 }}>{new Date(c.createdAt).toLocaleDateString()}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      postComment(a.id);
                    }}
                    style={{ display: "flex", gap: 8 }}
                  >
                    <input
                      type="text"
                      placeholder="Add a comment…"
                      value={commentText[a.id] ?? ""}
                      onChange={(e) => {
                        setCommentText((p) => ({ ...p, [a.id]: e.target.value }));
                        if (commentError[a.id] || emptyCommentTouched[a.id]) {
                          setCommentError((p) => ({ ...p, [a.id]: "" }));
                          setEmptyCommentTouched((p) => ({ ...p, [a.id]: false }));
                        }
                      }}
                      style={{ flex: 1, padding: "8px 12px", border: `1px solid ${THEME.border}`, borderRadius: 8, fontSize: 13 }}
                      aria-label="Comment text"
                    />
                    <button
                      type="submit"
                      disabled={posting[a.id]}
                      style={{
                        padding: "8px 16px",
                        background: THEME.accent,
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: posting[a.id] ? "not-allowed" : "pointer",
                      }}
                    >
                      {posting[a.id] ? "Posting…" : "Post"}
                    </button>
                  </form>
                  {commentError[a.id] && (
                    <p style={{ fontSize: 12, color: "#b91c1c", margin: "8px 0 0 0" }}>{commentError[a.id]}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
