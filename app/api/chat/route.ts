import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const PORTAL_SYSTEM = `You are a helpful assistant for the Biolongevity Labs affiliate program. You answer questions about commissions (up to 20%, tiered), MLM overrides, payouts (Tipalti, PayPal, Venmo, bank transfer), recruiting affiliates, and the application process. Be concise and friendly.`;
const ADMIN_SYSTEM = `You are a helpful assistant for admins of the Biolongevity Labs affiliate dashboard. You answer questions about top performers, commission settings, approving or rejecting affiliates, revenue, exports, and how to use the admin tools. Be concise and professional.`;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        configured: false,
        error: "Chat is not configured yet. Add your Anthropic API key to enable this feature.",
      });
    }

    const body = await req.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const context = body?.context === "admin" ? "admin" : "portal";

    if (!message) {
      return NextResponse.json({ configured: true, text: "Please ask a question." });
    }

    const system = context === "admin" ? ADMIN_SYSTEM : PORTAL_SYSTEM;

    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: message }],
    });

    const textBlock = response.content?.find((b) => b.type === "text");
    const text =
      textBlock && "text" in textBlock
        ? textBlock.text
        : "I couldn't generate a response. Please try again.";
    return NextResponse.json({ configured: true, text });
  } catch (err) {
    const fullError = err instanceof Error ? err.stack ?? err.message : String(err);
    console.error("[api/chat] Error:", fullError);
    return NextResponse.json(
      { configured: true, error: "Sorry, I couldn't process that request. Please try again." },
      { status: 200 }
    );
  }
}
