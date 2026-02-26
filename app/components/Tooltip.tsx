"use client";

import { useState, useRef } from "react";

export default function Tooltip({ text, children }: { text: string; children?: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setShow(true), 300);
  };
  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setShow(false), 100);
  };

  return (
    <span
      style={{ position: "relative", display: "inline-flex", alignItems: "center", verticalAlign: "middle" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children ?? (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "#e2e8f0",
            color: "#4a5568",
            fontSize: 11,
            fontWeight: 700,
            cursor: "help",
            border: "1px solid #cbd5e1",
          }}
        >
          ?
        </span>
      )}
      {show && (
        <span
          role="tooltip"
          style={{
            position: "absolute",
            left: "100%",
            top: "50%",
            transform: "translateY(-50%) translateX(8px)",
            background: "#ffffff",
            color: "#1a1a1a",
            fontSize: 12,
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
            minWidth: 280,
            maxWidth: 380,
            whiteSpace: "normal",
            zIndex: 1000,
            pointerEvents: "none",
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}
