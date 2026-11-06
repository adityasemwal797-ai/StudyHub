import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/call-me  { phone: string }   — places an outbound call to the user via Twilio.
 * GET  /api/call-me                       — reports whether phone calling is configured.
 *
 * Required env vars (set in .env, never commit them):
 *   TWILIO_ACCOUNT_SID   – from twilio.com/console
 *   TWILIO_AUTH_TOKEN    – from twilio.com/console
 *   TWILIO_FROM_NUMBER   – a Twilio phone number in E.164 format, e.g. +15551234567
 */

function twilioConfig() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  const missing: string[] = [];
  if (!sid) missing.push("TWILIO_ACCOUNT_SID");
  if (!token) missing.push("TWILIO_AUTH_TOKEN");
  if (!from) missing.push("TWILIO_FROM_NUMBER");
  return { sid, token, from, missing };
}

const SETUP_STEPS = [
  "Create a free Twilio account at twilio.com and verify your personal phone number.",
  "From the Twilio Console (twilio.com/console), copy your Account SID and Auth Token.",
  "Buy or claim a Twilio phone number (a free trial number works) — this is TWILIO_FROM_NUMBER in E.164 format, e.g. +12025550123.",
  "Add to your .env file: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER.",
  "Restart the app. Then enter your own phone number below and press “Call me”.",
  "Note: on a Twilio trial account, outbound calls only work to verified numbers, and the call plays a short trial announcement first.",
];

export async function GET() {
  const { missing } = twilioConfig();
  return NextResponse.json({
    configured: missing.length === 0,
    missing,
    setup: missing.length ? SETUP_STEPS : undefined,
  });
}

export async function POST(req: NextRequest) {
  const { sid, token, from, missing } = twilioConfig();

  let phone = "";
  try {
    const body = (await req.json()) as { phone?: string };
    phone = (body.phone ?? "").toString().trim();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!/^\+?[0-9]{8,15}$/.test(phone.replace(/[\s-]/g, ""))) {
    return NextResponse.json(
      { error: "Enter a valid phone number in international format, e.g. +919812345678." },
      { status: 400 }
    );
  }
  const to = phone.replace(/[\s-]/g, "").replace(/^00/, "+");
  const toE164 = to.startsWith("+") ? to : `+${to}`;

  if (missing.length) {
    return NextResponse.json(
      {
        error: "Phone calling is not configured yet.",
        configured: false,
        missing,
        setup: SETUP_STEPS,
      },
      { status: 501 }
    );
  }

  const origin = new URL(req.url).origin;
  const twimlUrl = `${origin}/api/twiml`;

  try {
    const params = new URLSearchParams({ To: toE164, From: from!, Url: twimlUrl });
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
      signal: AbortSignal.timeout(10000),
    });
    const data = (await res.json()) as { sid?: string; message?: string; status?: string };
    if (!res.ok) {
      console.error("[call-me] Twilio error:", data);
      return NextResponse.json(
        { error: data?.message ?? "Twilio rejected the call.", configured: true },
        { status: 502 }
      );
    }
    return NextResponse.json({ configured: true, status: "calling", callSid: data.sid, to: toE164 });
  } catch (err) {
    console.error("[call-me] error:", err);
    return NextResponse.json(
      { error: "Could not reach Twilio. Check the sandbox's network access and your credentials." },
      { status: 502 }
    );
  }
}
