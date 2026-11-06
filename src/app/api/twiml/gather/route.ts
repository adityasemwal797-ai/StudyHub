import { NextRequest, NextResponse } from "next/server";
import { getAgentReply } from "@/lib/brain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VOICE = "Polly.Aditi";
const LANG = "en-IN";
const MAX_TURNS = 10;

/**
 * Speech-gather loop for the phone call.
 * Twilio POSTs form-encoded data here with SpeechResult after each user utterance.
 * We run it through the same agent brain used by the in-browser voice chat,
 * speak the answer, and gather again. After MAX_TURNS we say goodbye.
 */
export async function POST(req: NextRequest) {
  const turn = Number(new URL(req.url).searchParams.get("t") ?? "1") || 1;

  let speech = "";
  try {
    const form = await req.formData();
    speech = (form.get("SpeechResult") ?? "").toString().trim();
  } catch {
    speech = "";
  }

  const nextT = turn + 1;

  if (!speech) {
    if (turn >= 2) {
      return xml(`<Response>
  <Say voice="${VOICE}" language="${LANG}">I still cannot hear you. Let's talk another time — happy studying, and goodbye!</Say>
  <Hangup/>
</Response>`);
    }
    return xml(`<Response>
  <Gather input="speech" action="/api/twiml/gather?t=${nextT}" method="POST" speechTimeout="auto" language="${LANG}">
    <Say voice="${VOICE}" language="${LANG}">Sorry, I didn't catch that. Please say it again.</Say>
  </Gather>
  <Hangup/>
</Response>`);
  }

  if (/^(bye|goodbye|end call|hang up|stop|exit)\b/i.test(speech)) {
    return xml(`<Response>
  <Say voice="${VOICE}" language="${LANG}">Bye! Great talking to you. Happy studying, and call me anytime you need me.</Say>
  <Hangup/>
</Response>`);
  }

  const { text } = await getAgentReply(speech, []);

  if (turn >= MAX_TURNS) {
    return xml(`<Response>
  <Say voice="${VOICE}" language="${LANG}">${escapeXml(text)}</Say>
  <Say voice="${VOICE}" language="${LANG}">We have had a nice long chat. I will let you go now — bye and happy studying!</Say>
  <Hangup/>
</Response>`);
  }

  return xml(`<Response>
  <Gather input="speech" action="/api/twiml/gather?t=${nextT}" method="POST" speechTimeout="auto" language="${LANG}">
    <Say voice="${VOICE}" language="${LANG}">${escapeXml(text)}</Say>
    <Say voice="${VOICE}" language="${LANG}">Anything else?</Say>
  </Gather>
  <Say voice="${VOICE}" language="${LANG}">Thanks for chatting, goodbye!</Say>
  <Hangup/>
</Response>`);
}

function xml(body: string) {
  return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?>\n${body}`, {
    status: 200,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
