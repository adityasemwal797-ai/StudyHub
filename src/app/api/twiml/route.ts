import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VOICE = "Polly.Aditi"; // Indian-English neural voice for a natural fit
const LANG = "en-IN";

/**
 * TwiML entry point for the outbound call placed by /api/call-me.
 * Twilio fetches this URL when the callee answers.
 * It greets the user and opens a speech-gather loop (see /api/twiml/gather).
 */
export async function POST() {
  return twimlResponse();
}

export async function GET() {
  return twimlResponse();
}

function twimlResponse() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${VOICE}" language="${LANG}">Hello! This is your StudyHub assistant calling. I can explain study concepts, do quick maths and unit conversions, tell you the time, or help with the app. How can I help you today?</Say>
  <Gather input="speech" action="/api/twiml/gather" method="POST" speechTimeout="auto" language="${LANG}">
    <Say voice="${VOICE}" language="${LANG}">Go ahead, I am listening.</Say>
  </Gather>
  <Say voice="${VOICE}" language="${LANG}">I did not hear anything. Call me back anytime on the StudyHub website. Goodbye!</Say>
  <Hangup/>
</Response>`;

  return new NextResponse(xml, {
    status: 200,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}
