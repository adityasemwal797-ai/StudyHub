import { NextRequest, NextResponse } from "next/server";
import { getAgentReply, type ChatTurn } from "@/lib/brain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/agent/chat
 * Body: { message: string, history?: { role: "user" | "assistant", content: string }[] }
 * Returns: { reply: string, source: "llm" | "local" }
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { message?: string; history?: ChatTurn[] };
    const message = (body.message ?? "").toString().trim();
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }
    if (message.length > 1000) {
      return NextResponse.json({ error: "Message too long" }, { status: 400 });
    }
    const history = Array.isArray(body.history)
      ? body.history
          .filter((t) => t && (t.role === "user" || t.role === "assistant") && typeof t.content === "string")
          .slice(-8)
      : [];

    const { text, source } = await getAgentReply(message, history);
    return NextResponse.json({ reply: text, source });
  } catch (err) {
    console.error("[agent/chat] error:", err);
    return NextResponse.json({ error: "The assistant is unavailable right now. Please try again." }, { status: 500 });
  }
}
