"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Bot,
  User,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ListChecks,
  Radio,
  ShieldCheck,
} from "lucide-react";

type CallState = "idle" | "listening" | "thinking" | "speaking";
type Bubble = { role: "user" | "assistant"; content: string };
type PhoneStatus = "idle" | "calling" | "success" | "needs-setup" | "error";

const CHIPS = [
  "What is photosynthesis?",
  "Convert 10 kilometers to miles",
  "What is 25 times 17?",
  "Give me a study tip",
  "What is Ohm's law?",
  "What's the time right now?",
];

export default function CallPage() {
  /* ---------- voice call state ---------- */
  const [callState, setCallState] = useState<CallState>("idle");
  const [inCall, setInCall] = useState(false);
  const [muted, setMuted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [interim, setInterim] = useState("");
  const [transcript, setTranscript] = useState<Bubble[]>([]);
  const [typed, setTyped] = useState("");
  const [speechSupported, setSpeechSupported] = useState(true);
  const [micError, setMicError] = useState(false);

  const recognitionRef = useRef<any>(null);
  const callActiveRef = useRef(false);
  const mutedRef = useRef(false);
  const busyRef = useRef(false);
  const transcriptRef = useRef<Bubble[]>([]);
  const transcriptBoxRef = useRef<HTMLDivElement>(null);

  /* ---------- phone (Twilio) state ---------- */
  const [phone, setPhone] = useState("+91 ");
  const [phoneStatus, setPhoneStatus] = useState<PhoneStatus>("idle");
  const [phoneMsg, setPhoneMsg] = useState("");
  const [setupSteps, setSetupSteps] = useState<string[]>([]);
  const [missingVars, setMissingVars] = useState<string[]>([]);
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    setSpeechSupported(
      typeof window !== "undefined" &&
        !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    );
    fetch("/api/call-me")
      .then((r) => r.json())
      .then((d) => setConfigured(!!d.configured))
      .catch(() => setConfigured(null));
  }, []);

  useEffect(() => {
    transcriptRef.current = transcript;
    const box = transcriptBoxRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [transcript]);

  useEffect(() => {
    if (!inCall) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [inCall]);

  useEffect(() => () => {
    callActiveRef.current = false;
    try { recognitionRef.current?.stop(); } catch {}
    window.speechSynthesis?.cancel();
  }, []);

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  /* ---------- speech helpers ---------- */
  const pickVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    return (
      voices.find((v) => /en[-_]IN/i.test(v.lang)) ||
      voices.find((v) => /^en[-_]GB/i.test(v.lang)) ||
      voices.find((v) => /^en/i.test(v.lang)) ||
      null
    );
  };

  const speak = useCallback((text: string) => {
    const synth = window.speechSynthesis;
    if (!synth) { setCallState("idle"); return; }
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-IN";
    utter.rate = 1.02;
    utter.pitch = 1;
    const v = pickVoice();
    if (v) utter.voice = v;
    utter.onstart = () => setCallState("speaking");
    utter.onend = () => {
      busyRef.current = false;
      if (callActiveRef.current && !mutedRef.current) startListening();
      else setCallState("idle");
    };
    utter.onerror = () => {
      busyRef.current = false;
      setCallState(callActiveRef.current ? "idle" : "idle");
    };
    synth.speak(utter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startListening = useCallback(() => {
    if (!callActiveRef.current || mutedRef.current || busyRef.current) {
      setCallState("idle");
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setSpeechSupported(false); setCallState("idle"); return; }
    try { recognitionRef.current?.stop(); } catch {}
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-IN";
    let finalText = "";
    rec.onresult = (e: any) => {
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalText += res[0].transcript;
        else interimText += res[0].transcript;
      }
      setInterim(interimText || finalText);
      if (finalText.trim()) {
        setInterim("");
        const said = finalText.trim();
        finalText = "";
        handleUserSaid(said);
      }
    };
    rec.onerror = (e: any) => {
      if (e?.error === "not-allowed" || e?.error === "service-not-allowed") {
        setMicError(true);
        callActiveRef.current = false;
        setInCall(false);
        setCallState("idle");
      }
    };
    rec.onend = () => {
      setInterim("");
      if (!callActiveRef.current || mutedRef.current || busyRef.current) return;
      // Silence with no speech — keep the loop alive.
      window.setTimeout(() => {
        if (callActiveRef.current && !mutedRef.current && !busyRef.current) startListening();
      }, 350);
    };
    recognitionRef.current = rec;
    setCallState("listening");
    try { rec.start(); } catch { /* already started */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUserSaid = useCallback(async (text: string) => {
    const msg = text.trim();
    if (!msg) return;
    busyRef.current = true;
    try { recognitionRef.current?.stop(); } catch {}
    setCallState("thinking");
    setInterim("");
    const next = [...transcriptRef.current, { role: "user" as const, content: msg }];
    setTranscript(next);
    transcriptRef.current = next;
    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history: next.slice(-8) }),
      });
      const data = await res.json();
      const reply = (res.ok && data.reply) ? data.reply as string
        : "Sorry, I could not think of an answer just now. Please try again.";
      setTranscript((t) => [...t, { role: "assistant", content: reply }]);
      speak(reply);
    } catch {
      const reply = "Sorry, I lost my connection for a moment. Please say that again.";
      setTranscript((t) => [...t, { role: "assistant", content: reply }]);
      speak(reply);
    }
  }, [speak]);

  const startCall = () => {
    setMicError(false);
    setTranscript([]);
    transcriptRef.current = [];
    setSeconds(0);
    setInCall(true);
    callActiveRef.current = true;
    mutedRef.current = false;
    setMuted(false);
    busyRef.current = true; // speaking the greeting
    const hour = new Date().getHours();
    const tod = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    const greeting = `${tod}! This is your StudyHub assistant. I can explain study concepts, do quick maths and unit conversions, share study tips, or help you use the app. What would you like to know?`;
    setTranscript([{ role: "assistant", content: greeting }]);
    speak(greeting);
  };

  const endCall = () => {
    callActiveRef.current = false;
    busyRef.current = false;
    try { recognitionRef.current?.stop(); } catch {}
    window.speechSynthesis?.cancel();
    setCallState("idle");
    setInCall(false);
    setInterim("");
  };

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m;
      mutedRef.current = next;
      if (next) {
        try { recognitionRef.current?.stop(); } catch {}
        window.speechSynthesis?.cancel();
        busyRef.current = false;
        setCallState("idle");
      } else if (callActiveRef.current && callState !== "speaking" && callState !== "thinking") {
        startListening();
      }
      return next;
    });
  };

  const askTyped = () => {
    const msg = typed.trim();
    if (!msg) return;
    setTyped("");
    if (callActiveRef.current) handleUserSaid(msg);
    else {
      busyRef.current = true;
      // Standalone Q&A when not in a call — still spoken aloud.
      (async () => {
        setCallState("thinking");
        const next = [...transcriptRef.current, { role: "user" as const, content: msg }];
        setTranscript(next);
        transcriptRef.current = next;
        try {
          const res = await fetch("/api/agent/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: msg, history: next.slice(-8) }),
          });
          const data = await res.json();
          const reply = data.reply ?? "Sorry, something went wrong.";
          setTranscript((t) => [...t, { role: "assistant", content: reply }]);
          speak(reply);
        } catch {
          speak("Sorry, I could not reach my brain. Please try again.");
        }
      })();
    }
  };

  /* ---------- outbound phone call ---------- */
  const requestPhoneCall = async () => {
    const number = phone.trim();
    if (!/^\+?[0-9][0-9\s-]{7,17}$/.test(number)) {
      setPhoneStatus("error");
      setPhoneMsg("Enter a valid number in international format, e.g. +91 98123 45678.");
      return;
    }
    setPhoneStatus("calling");
    setPhoneMsg("");
    try {
      const res = await fetch("/api/call-me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: number }),
      });
      const data = await res.json();
      if (res.ok) {
        setPhoneStatus("success");
        setPhoneMsg(`Ringing ${data.to ?? number}… pick up — your StudyHub assistant is on the line.`);
      } else if (res.status === 501) {
        setPhoneStatus("needs-setup");
        setMissingVars(data.missing ?? []);
        setSetupSteps(data.setup ?? []);
      } else {
        setPhoneStatus("error");
        setPhoneMsg(data.error ?? "The call could not be placed. Please try again.");
      }
    } catch {
      setPhoneStatus("error");
      setPhoneMsg("Network error while placing the call. Please try again.");
    }
  };

  const statusLabel: Record<CallState, string> = {
    idle: inCall ? "On call — mic off" : "Ready when you are",
    listening: "Listening…",
    thinking: "Thinking…",
    speaking: "Speaking…",
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-white selection:bg-amber-400/30">
      {/* ambient glows */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[480px] w-[480px] rounded-full bg-amber-500/10 blur-[140px]" />
        <div className="absolute -bottom-40 -right-32 h-[520px] w-[520px] rounded-full bg-sky-500/10 blur-[150px]" />
        <div className="absolute top-1/3 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-emerald-500/5 blur-[160px]" />
      </div>

      {/* top bar */}
      <header className="relative z-10 border-b border-white/5 bg-white/[0.02] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white">
            <ArrowLeft size={18} /> StudyHub
          </Link>
          <div className="flex items-center gap-3">
            {inCall && (
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 font-mono text-xs font-bold text-emerald-300 tabular-nums">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> {mmss}
              </span>
            )}
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300">
              <Radio size={13} /> Live AI Agent
            </span>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
        {/* heading */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Talk to your{" "}
            <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-orange-300 bg-clip-text text-transparent">
              StudyHub Assistant
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-slate-400">
            A real conversation, out loud — study concepts, quick maths, conversions, time, motivation
            and help with the app. Or get the agent to ring your phone.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          {/* ============ LEFT: the call stage ============ */}
          <section className="flex flex-col items-center rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6 shadow-2xl sm:p-8">
            {/* orb */}
            <div className="relative flex h-56 w-56 items-center justify-center sm:h-64 sm:w-64">
              {inCall && (callState === "listening" || callState === "speaking") && (
                <>
                  <span className="ring-ping absolute inline-flex h-32 w-32 rounded-full border border-emerald-400/40" />
                  <span className="ring-ping absolute inline-flex h-32 w-32 rounded-full border border-sky-400/30" style={{ animationDelay: "0.7s" }} />
                </>
              )}
              <div
                className={`orb h-40 w-40 rounded-full transition-all sm:h-48 sm:w-48 ${
                  callState === "listening" ? "orb-listening" :
                  callState === "thinking" ? "orb-thinking" :
                  callState === "speaking" ? "orb-speaking" : ""
                }`}
              />
            </div>

            {/* status + waveform */}
            <div className="mt-6 flex h-8 items-end gap-1.5" aria-hidden>
              {(callState === "listening" || callState === "speaking")
                ? [0.9, 0.5, 0.75, 1, 0.6, 0.85, 0.4, 0.95, 0.7, 0.55, 0.8, 0.65].map((d, i) => (
                    <span
                      key={i}
                      className="wave-bar h-8 w-1.5 rounded-full bg-gradient-to-t from-emerald-400 to-amber-300"
                      style={{ animationDelay: `${i * 0.09 * d}s`, animationDuration: `${0.7 + d * 0.6}s` }}
                    />
                  ))
                : <span className="h-px w-40 bg-gradient-to-r from-transparent via-white/30 to-transparent" />}
            </div>
            <p className="mt-3 text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">{statusLabel[callState]}</p>
            {interim && <p className="mt-2 max-w-md text-center text-sm italic text-emerald-200/90">“{interim}”</p>}

            {/* call controls */}
            <div className="mt-8 flex items-center gap-5">
              {inCall && (
                <button
                  onClick={toggleMute}
                  aria-label={muted ? "Unmute microphone" : "Mute microphone"}
                  title={muted ? "Unmute microphone" : "Mute microphone"}
                  className={`flex h-14 w-14 items-center justify-center rounded-full border transition ${
                    muted
                      ? "border-red-400/40 bg-red-500/20 text-red-300 hover:bg-red-500/30"
                      : "border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                  }`}
                >
                  {muted ? <MicOff size={22} /> : <Mic size={22} />}
                </button>
              )}
              {!inCall ? (
                <button
                  onClick={startCall}
                  aria-label="Start voice call"
                  className="group flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-600 shadow-2xl shadow-emerald-500/40 transition hover:scale-110 hover:shadow-emerald-400/50"
                >
                  <Phone size={32} className="transition group-hover:rotate-12" />
                </button>
              ) : (
                <button
                  onClick={endCall}
                  aria-label="End call"
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-rose-700 shadow-2xl shadow-red-500/40 transition hover:scale-110"
                >
                  <PhoneOff size={30} />
                </button>
              )}
              <div className={`flex h-14 w-14 items-center justify-center rounded-full border transition ${inCall && !muted ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "border-white/10 bg-white/[0.03] text-slate-500"}`}>
                <Mic size={22} />
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">{inCall ? (muted ? "Mic muted — tap the mic to talk" : "Speak naturally — the agent hears you") : "Tap the green button to call the agent"}</p>

            {/* capability chips */}
            <div className="mt-7 flex flex-wrap justify-center gap-2">
              {CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleUserSaid(chip)}
                  className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-amber-400/40 hover:bg-amber-400/10 hover:text-amber-200"
                >
                  {chip}
                </button>
              ))}
            </div>
          </section>

          {/* ============ RIGHT: transcript + phone call ============ */}
          <div className="flex flex-col gap-6">
            {/* transcript */}
            <section className="flex min-h-[280px] flex-1 flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-slate-400">
                  <Bot size={16} className="text-amber-400" /> Live Transcript
                </h2>
                {transcript.length > 0 && (
                  <button onClick={() => setTranscript([])} className="text-xs font-semibold text-slate-500 transition hover:text-slate-300">
                    Clear
                  </button>
                )}
              </div>
              <div ref={transcriptBoxRef} className="max-h-[340px] flex-1 space-y-3 overflow-y-auto pr-1">
                {transcript.length === 0 ? (
                  <div className="flex h-full min-h-[160px] flex-col items-center justify-center text-center">
                    <Sparkles size={28} className="mb-3 text-amber-400/60" />
                    <p className="max-w-[260px] text-sm text-slate-500">
                      Your conversation will appear here. Tap the green call button, or ask something below.
                    </p>
                  </div>
                ) : (
                  transcript.map((b, i) => (
                    <div key={i} className={`flex gap-2.5 ${b.role === "user" ? "flex-row-reverse" : ""}`}>
                      <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${b.role === "user" ? "bg-amber-400 text-[#0B1120]" : "bg-slate-700 text-amber-300"}`}>
                        {b.role === "user" ? <User size={14} /> : <Bot size={14} />}
                      </span>
                      <p className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        b.role === "user"
                          ? "rounded-tr-md bg-amber-400/90 font-medium text-[#0B1120]"
                          : "rounded-tl-md border border-white/5 bg-white/5 text-slate-100"
                      }`}>
                        {b.content}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* typed fallback */}
              <form
                onSubmit={(e) => { e.preventDefault(); askTyped(); }}
                className="mt-4 flex items-center gap-2 border-t border-white/5 pt-4"
              >
                <input
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder={speechSupported ? "Or type a question…" : "Mic not supported here — type your question…"}
                  className="h-12 flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-amber-400/40 focus:bg-white/[0.07]"
                  aria-label="Type a question"
                />
                <button type="submit" aria-label="Send" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-[#0B1120] transition hover:bg-amber-300">
                  <Send size={18} />
                </button>
              </form>
              {micError && (
                <p className="mt-2 flex items-center gap-2 text-xs font-medium text-red-300"><AlertCircle size={14} /> Microphone blocked or unavailable — type instead, the agent will still speak its answers.</p>
              )}
              {!speechSupported && (
                <p className="mt-2 flex items-center gap-2 text-xs font-medium text-amber-300"><AlertCircle size={14} /> This browser doesn't support voice listening (try Chrome). Typing works fully.</p>
              )}
            </section>

            {/* real phone call */}
            <section className="rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 via-emerald-400/5 to-transparent p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-emerald-300">
                  <Smartphone size={16} /> Get a Call on Your Phone
                </h2>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                  configured === null ? "bg-white/5 text-slate-400" :
                  configured ? "bg-emerald-400/15 text-emerald-300" : "bg-amber-400/15 text-amber-300"
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${configured ? "bg-emerald-400" : "bg-amber-400"}`} />
                  {configured === null ? "Checking…" : configured ? "Line ready" : "Setup needed"}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-400">
                The agent will ring your number over an ordinary phone line (Twilio) and talk to you with your mic — no app needed.
              </p>

              <form onSubmit={(e) => { e.preventDefault(); requestPhoneCall(); }} className="mt-4 flex gap-2">
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="tel"
                  placeholder="+91 98123 45678"
                  aria-label="Your phone number"
                  className="h-12 flex-1 rounded-2xl border border-emerald-400/20 bg-black/30 px-4 font-mono text-sm text-emerald-100 placeholder-slate-600 outline-none transition focus:border-emerald-400/50"
                />
                <button
                  type="submit"
                  disabled={phoneStatus === "calling"}
                  className="inline-flex h-12 items-center gap-2 rounded-2xl bg-emerald-500 px-5 text-sm font-extrabold text-[#04281a] transition hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-70"
                >
                  {phoneStatus === "calling" ? <Loader2 size={17} className="animate-spin" /> : <Phone size={17} />}
                  Call me
                </button>
              </form>

              {phoneStatus === "success" && (
                <p className="mt-3 flex items-start gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-200"><CheckCircle2 size={18} className="mt-0.5 shrink-0" />{phoneMsg}</p>
              )}
              {phoneStatus === "error" && (
                <p className="mt-3 flex items-start gap-2 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-200"><AlertCircle size={18} className="mt-0.5 shrink-0" />{phoneMsg}</p>
              )}
              {phoneStatus === "needs-setup" && (
                <div className="mt-3 rounded-2xl border border-amber-400/30 bg-amber-400/5 p-4">
                  <p className="flex items-center gap-2 text-sm font-bold text-amber-300"><ListChecks size={16} /> One-time setup to enable real calls</p>
                  {missingVars.length > 0 && (
                    <p className="mt-1.5 text-xs text-slate-400">Missing env vars: <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-amber-200">{missingVars.join(", ")}</code></p>
                  )}
                  <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-xs leading-relaxed text-slate-300">
                    {setupSteps.map((s, i) => <li key={i}>{s}</li>)}
                  </ol>
                  <p className="mt-3 flex items-center gap-2 text-[11px] text-slate-500"><ShieldCheck size={13} /> Your number is used once for this call and is never stored by the app.</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
