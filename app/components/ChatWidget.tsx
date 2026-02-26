"use client";

import { useState, useRef, useEffect } from "react";

const PORTAL_SUGGESTIONS = [
  "How much can I earn?",
  "How do MLM overrides work?",
  "When do I get paid?",
  "How do I recruit someone?",
];

const ADMIN_SUGGESTIONS = [
  "Who are my top performers?",
  "How do I change commission rates?",
  "How do I approve an affiliate?",
  "Show me this month's revenue",
];

const LIGHT_THEME = {
  bg: "#ffffff",
  border: "#e2e8f0",
  accent: "#1a4a8a",
  text: "#1a1a2e",
  textMuted: "#4a5568",
  buttonBg: "#1a4a8a",
  panelShadow: "0 8px 32px rgba(0,0,0,0.08)",
};

type ChatWidgetProps = {
  context: "portal" | "admin";
  label?: string;
};

export default function ChatWidget({ context, label }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const suggestions = context === "admin" ? ADMIN_SUGGESTIONS : PORTAL_SUGGESTIONS;
  const defaultLabel = context === "portal" ? "Ask anything about our program" : "Ask about the admin dashboard";

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [open, messages]);

  const send = async (text: string) => {
    const msg = text.trim();
    if (!msg || loading) return;
    setMessages((m) => [...m, { role: "user", text: msg }]);
    setInput("");
    setLoading(true);
    setConfigured(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, context }),
      });
      const data = (await res.json()) as {
        configured?: boolean;
        text?: string;
        error?: string;
        debug?: string;
      };
      if (data.configured === false) {
        setConfigured(false);
        setMessages((m) => [...m, { role: "assistant", text: data.error ?? "Chat is not configured yet. Add your Anthropic API key to enable this feature." }]);
        return;
      }
      setConfigured(true);
      const reply = data.error ?? data.text ?? "Something went wrong. Please try again.";
      if (data.error) {
        console.error("[ChatWidget] API returned error:", data.error, data.debug ?? "");
      }
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch (e) {
      const errMessage = e instanceof Error ? e.message : "Something went wrong. Please try again.";
      console.error("[ChatWidget] Request failed:", e);
      setMessages((m) => [...m, { role: "assistant", text: errMessage }]);
    } finally {
      setLoading(false);
    }
  };

  const displayLabel = label ?? defaultLabel;

  return (
    <>
      <div
        ref={panelRef}
        style={{
          display: open ? "flex" : "none",
          flexDirection: "column",
          position: "fixed",
          bottom: 80,
          right: 20,
          width: "min(380px, calc(100vw - 40px))",
          height: "min(480px, 70vh)",
          background: LIGHT_THEME.bg,
          border: `1px solid ${LIGHT_THEME.border}`,
          borderRadius: 16,
          boxShadow: LIGHT_THEME.panelShadow,
          zIndex: 9998,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "14px 16px",
            borderBottom: `1px solid ${LIGHT_THEME.border}`,
            background: "#f8f9fa",
            fontSize: 14,
            fontWeight: 600,
            color: LIGHT_THEME.text,
          }}
        >
          {displayLabel}
        </div>
        <div
          ref={listRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {messages.length === 0 && !loading && (
            <p style={{ fontSize: 13, color: LIGHT_THEME.textMuted, margin: 0 }}>
              Choose a question below or type your own.
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "85%",
                padding: "10px 14px",
                borderRadius: 12,
                background: m.role === "user" ? LIGHT_THEME.accent : "#f1f5f9",
                color: m.role === "user" ? "#fff" : LIGHT_THEME.text,
                fontSize: 14,
                lineHeight: 1.5,
              }}
            >
              {m.text}
            </div>
          ))}
          {loading && (
            <div
              style={{
                alignSelf: "flex-start",
                padding: "10px 14px",
                borderRadius: 12,
                background: "#f1f5f9",
                color: LIGHT_THEME.textMuted,
                fontSize: 14,
              }}
            >
              Thinking…
            </div>
          )}
        </div>
        {messages.length === 0 && !loading && (
          <div style={{ padding: "0 16px 12px", display: "flex", flexWrap: "wrap", gap: 8 }}>
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => send(s)}
                style={{
                  padding: "8px 12px",
                  background: "#f8f9fa",
                  border: `1px solid ${LIGHT_THEME.border}`,
                  borderRadius: 8,
                  fontSize: 12,
                  color: LIGHT_THEME.accent,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          style={{
            padding: 12,
            borderTop: `1px solid ${LIGHT_THEME.border}`,
            background: "#f8f9fa",
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question…"
              disabled={loading}
              style={{
                flex: 1,
                padding: "10px 14px",
                border: `1px solid ${LIGHT_THEME.border}`,
                borderRadius: 10,
                fontSize: 14,
                color: LIGHT_THEME.text,
                background: LIGHT_THEME.bg,
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                padding: "10px 18px",
                background: LIGHT_THEME.buttonBg,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                opacity: loading || !input.trim() ? 0.7 : 1,
              }}
            >
              Send
            </button>
          </div>
        </form>
      </div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open chat"
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: LIGHT_THEME.accent,
          color: "#fff",
          border: "none",
          boxShadow: "0 4px 14px rgba(26, 74, 138, 0.4)",
          cursor: "pointer",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
      </button>
    </>
  );
}
