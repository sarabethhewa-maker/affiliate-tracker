import { NextRequest, NextResponse } from "next/server";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const PORTAL_SYSTEM = `You are a helpful assistant for the Biolongevity Labs affiliate program. You answer questions about commissions (up to 20%, tiered), MLM overrides, payouts (Tipalti, PayPal, Venmo, bank transfer), recruiting affiliates, and the application process. Be concise and friendly.`;
const ADMIN_SYSTEM = `You are a helpful assistant for admins of the Biolongevity Labs affiliate dashboard. You answer questions about top performers, commission settings, approving or rejecting affiliates, revenue, exports, and how to use the admin tools. Be concise and professional.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const context = body?.context === "admin" ? "admin" : "portal";

    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json({
        configured: false,
        error: "Chat is not configured yet. Add your Anthropic API key to enable this feature.",
      });
    }

    if (!message) {
      return NextResponse.json({ configured: true, text: "Please ask a question." });
    }

    const system = context === "admin" ? ADMIN_SYSTEM : PORTAL_SYSTEM;
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        system,
        messages: [{ role: "user" as const, content: message }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { configured: true, error: "The assistant is temporarily unavailable. Please try again." },
        { status: 200 }
      );
    }

    const data = (await res.json()) as {
      content?: Array<{ type?: string; text?: string }>;
    };
    const text =
      data?.content?.find((b) => b.type === "text")?.text ??
      "I couldn't generate a response. Please try again.";
    return NextResponse.json({ configured: true, text });
  } catch {
    return NextResponse.json(
      { configured: true, error: "Something went wrong. Please try again." },
      { status: 200 }
    );
  }
}
