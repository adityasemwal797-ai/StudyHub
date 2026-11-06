/**
 * StudyHub Assistant — the brain behind the voice agent.
 *
 * Two layers:
 *  1. LLM (optional)  – if LLM_API_KEY is set, requests go to any OpenAI-compatible
 *     /chat/completions endpoint (LLM_BASE_URL / LLM_MODEL). Great for open-ended
 *     general-purpose chat.
 *  2. Local brain     – a deterministic, offline fallback that always works,
 *     handles greetings, time/date, math, unit conversion, study Q&A,
 *     app (StudyHub) help, motivation and jokes. Spans the gap when no LLM
 *     is configured or the network is unreachable.
 */

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface AgentReply {
  text: string;
  source: "llm" | "local";
}

const SYSTEM_PROMPT = `You are StudyHub Assistant, a warm, upbeat general-purpose voice companion for Indian students.
Rules: keep replies under 70 words (they are spoken aloud), plain sentences, no markdown, no emoji, no lists.
You help with study questions, quick facts, math, motivation, and using the StudyHub app (sharing notes, NCERT books, study planner).
If you don't know something, say so honestly and suggest a narrower question.`;

/* ------------------------------------------------------------------ */
/* Optional LLM layer                                                  */
/* ------------------------------------------------------------------ */

export async function getAgentReply(message: string, history: ChatTurn[] = []): Promise<AgentReply> {
  const apiKey = process.env.LLM_API_KEY;
  if (apiKey) {
    try {
      const reply = await callLLM(message, history, apiKey);
      if (reply) return { text: reply, source: "llm" };
    } catch (err) {
      console.error("[agent] LLM call failed, falling back to local brain:", err);
    }
  }
  return { text: localBrain(message), source: "local" };
}

async function callLLM(message: string, history: ChatTurn[], apiKey: string): Promise<string | null> {
  const base = (process.env.LLM_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.LLM_MODEL ?? "gpt-4o-mini";
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      max_tokens: 160,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...history.slice(-8).map((t) => ({ role: t.role, content: t.content })),
        { role: "user", content: message },
      ],
    }),
    signal: AbortSignal.timeout(9000),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content?.trim();
  return text ? text.replace(/[*_#`]/g, "") : null;
}

/* ------------------------------------------------------------------ */
/* Local brain                                                         */
/* ------------------------------------------------------------------ */

export function localBrain(rawInput: string): string {
  const input = rawInput.trim();
  const msg = input.toLowerCase().replace(/\s+/g, " ");
  if (!msg) return "I didn't catch that. Could you say it again?";

  /* --- greetings & identity --- */
  if (/^(hi|hello|hey|namaste|yo|good morning|good afternoon|good evening|good night)\b/.test(msg)) {
    return "Hello! Great to hear from you. I'm your StudyHub assistant. Ask me a study question, a quick calculation, unit conversions, study tips, or how to use StudyHub. What's on your mind?";
  }
  if (/(who are you|what are you|your name|about yourself|introduce yourself)/.test(msg)) {
    return "I'm StudyHub Assistant, your general-purpose study companion built into StudyHub. I can explain concepts, do quick math and conversions, share study tips, and help you use the app. And yes, you called me — I'm right here.";
  }
  if (/(who made you|who built you|who created you|your creator)/.test(msg)) {
    return "I was built right inside StudyHub, the student resource sharing platform, to be your always-available study companion.";
  }
  if (/(how are you|how's it going|how are you doing)/.test(msg)) {
    return "I'm running perfectly, thanks for asking. More importantly, how are you and your studies going? What would you like to work on today?";
  }
  if (/\b(thank you|thanks|thx|shukriya|dhanyavaad)\b/.test(msg)) {
    return "You're very welcome. Keep going, you're doing great. Anything else I can help you with?";
  }
  if (/^(bye|goodbye|see you|good night|exit|end call|hang up)\b/.test(msg)) {
    return "Take care and happy studying. Press the red button to end the call, and call me anytime you need me. Bye for now!";
  }

  /* --- time & date --- */
  if (/\b(what('s| is)?\s*(the)?\s*time|current time|tell me the time|kitne baj)/.test(msg)) {
    const t = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Calcutta" }).format(new Date());
    return `It's ${t} in India right now.`;
  }
  if (/\b(what('s| is)?\s*(the|today's)?\s*date|today's date|what date)/.test(msg)) {
    const d = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Calcutta" }).format(new Date());
    return `Today is ${d}.`;
  }
  if (/\b(what day is (it|today)|which day|weekday|kaun sa din)/.test(msg)) {
    const d = new Intl.DateTimeFormat("en-IN", { weekday: "long", timeZone: "Asia/Calcutta" }).format(new Date());
    return `Today is ${d}. A good day to revise one chapter before you sleep, no?`;
  }

  /* --- math --- */
  const mathAnswer = tryMath(input);
  if (mathAnswer) return mathAnswer;

  const pct = msg.match(/(\d+(?:\.\d+)?)\s*%\s*(?:of)\s+(\d+(?:\.\d+)?)/);
  if (pct) {
    return `${pct[1]} percent of ${pct[2]} is ${round((parseFloat(pct[1]) / 100) * parseFloat(pct[2]))}.`;
  }
  const sqrt = msg.match(/square root of (\d+(?:\.\d+)?)/);
  if (sqrt) {
    return `The square root of ${sqrt[1]} is ${round(Math.sqrt(parseFloat(sqrt[1])))}.`;
  }

  /* --- unit conversions --- */
  const conv = tryConversion(msg);
  if (conv) return conv;

  /* --- StudyHub app help --- */
  if (/(share|upload|contribute).*(resource|note|file|material|pdf)|how (do|can) i share/.test(msg)) {
    return "To share a resource, scroll to the Share Resources section on the home page, pick the type, add a title, category and link or upload, and submit. Your contribution helps hundreds of students, so every note counts.";
  }
  if (/(find|get|access|download).*(resource|note|material|books?)/.test(msg)) {
    return "You can browse everything from the Resources section on the home page. Filter by category, and check the NCERT Books section if you're looking for standard textbooks.";
  }
  if (/ncert/.test(msg)) {
    return "StudyHub has a dedicated NCERT Books section. Scroll to the NCERT area on the home page and you'll find books organized by class. NCERT covers most of CBSE, so start there before anything else.";
  }
  if (/(planner|study plan|schedule|time table|timetable)/.test(msg)) {
    return "The Study Planner on the home page lets you add tasks with due dates, mark them done and track your progress. Try the Pomodoro method with it: 25 minutes of focus, 5 minutes of break, repeat four times.";
  }
  if (/(call me|phone call|ring me|call my phone|outbound call)/.test(msg)) {
    return "You can get a real phone call from me. On the call page, enter your number in the Call my phone card and press Call me. It connects you to the same assistant over a Twilio line.";
  }

  /* --- study & motivation --- */
  if (/(study tip|how to study|how should i study|how to focus|focus better|concentrat)/.test(msg)) {
    return "Here's a simple system: study one chapter at a time, close the book and recall it from memory, then write what you forgot. Active recall plus spaced repetition beats rereading every time. Sleep well too — memory consolidates while you sleep.";
  }
  if (/(exam|board exam|preparation|prepare for)/.test(msg)) {
    return "For exams: first pass is notes, second pass is solving problems, third pass is previous year papers. Time yourself, analyze mistakes, and never skip revision in the last week. Want a planner tip too?";
  }
  if (/(motivat|inspire|give up|stressed|anxious|tired|scared)/.test(msg)) {
    return "Listen, feeling stuck doesn't mean you're failing. Take a ten minute walk, drink some water, then do just one small task. Momentum beats motivation. You chose to study today, and that already counts. I'm rooting for you.";
  }
  if (/(quote|inspire me|saying)/.test(msg)) {
    return "Here's one: discipline is choosing between what you want now and what you want most. Your future marks are built in these quiet evenings. Keep going.";
  }
  if (/pomodoro/.test(msg)) {
    return "The Pomodoro technique is simple: pick one task, set a 25 minute timer, work until it rings, take a 5 minute break. After four rounds, take a longer 20 minute break. It keeps your brain fresh and kills procrastination.";
  }

  /* --- jokes --- */
  if (/(joke|make me laugh|funny)/.test(msg)) {
    const jokes = [
      "Why did the student eat his homework? Because the teacher said it was a piece of cake.",
      "Parallel lines have so much in common. It's a shame they'll never meet.",
      "I told a grammar joke once. Now I'm a comma — I pause, but I always deliver.",
      "Science students don't get lonely. Hydrogen and oxygen meet every day to make water.",
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
  }

  /* --- study science facts --- */
  const fact = FACTS.find(([key]) => msg.includes(key));
  if (fact) return fact[1];

  /* --- closing / fallback --- */
  if (/help/.test(msg)) {
    return "I can explain study concepts like photosynthesis, Newton's laws, Ohm's law and the periodic table. I can do math like 25 times 4, conversions like 5 km to miles, tell you the time and date, share study tips, motivation, jokes, and help you use StudyHub. Try one of those.";
  }
  return "That's outside what I know confidently right now. I'm best at study concepts, quick math, unit conversions, time and date, study tips, and StudyHub help. Try asking me something like — what is photosynthesis, or convert 10 kilograms to pounds.";
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function round(n: number): string {
  if (!Number.isFinite(n)) return "an undefined number";
  const r = Math.round(n * 1e6) / 1e6;
  return String(r);
}

/** Safely evaluate a plain arithmetic expression found in the message. */
function tryMath(input: string): string | null {
  // Normalise spoken operators so "what's 25 times 17?" becomes an expression.
  const lowered = input
    .trim()
    .replace(/[?.!]+$/, "")
    .toLowerCase()
    .replace(/\b(?:multiplied\s+by|multiply\s+by|times|into|x|×)\b/g, "*")
    .replace(/\bdivided\s+by\b|\bdivide\b/g, "/")
    .replace(/\bplus|\badd(?:ed)?\b/g, "+")
    .replace(/\bminus|\bsubtract(?:ed)?\b/g, "-")
    .replace(/\bto the power of\b|\braised to\b/g, "^")
    .replace(/\bmod(?:ulo)?\b/g, "%");

  let candidate: string | null = null;
  if (/^[\d\s()+\-*/.^%]+$/.test(lowered) && /\d/.test(lowered)) {
    candidate = lowered;
  } else {
    const m = lowered.match(/(?:calculate|compute|what is|what's|solve|evaluate|value of)\s*([\d\s()+\-*/.^%]{2,80})$/);
    if (m && /\d/.test(m[1])) candidate = m[1];
  }
  if (!candidate) return null;

  const expr = candidate.replace(/\^/g, "**").replace(/%/g, "/100").trim();
  if (!/^[\d\s()+\-*/.]+$/.test(expr.replace(/\*\*/g, "*"))) return null;
  try {
    // Expression is sanitized above to digits and arithmetic operators only.
    const value = Function(`"use strict"; return (${expr})`)() as number;
    if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) return null;
    return `The answer is ${round(value)}.`;
  } catch {
    return null;
  }
}

const CONVERSIONS: { from: RegExp; apply: (v: number) => [number, string] }[] = [
  { from: /^(kilometers?|km)$/, apply: (v) => [v * 0.621371, "miles"] },
  { from: /^(miles?|mi)$/, apply: (v) => [v * 1.60934, "kilometers"] },
  { from: /^(meters?|m)$/, apply: (v) => [v * 3.28084, "feet"] },
  { from: /^(feet|foot|ft)$/, apply: (v) => [v * 0.3048, "meters"] },
  { from: /^(centimeters?|cm)$/, apply: (v) => [v * 0.393701, "inches"] },
  { from: /^(inches?|in)$/, apply: (v) => [v * 2.54, "centimeters"] },
  { from: /^(kilograms?|kg)$/, apply: (v) => [v * 2.20462, "pounds"] },
  { from: /^(pounds?|lbs?)$/, apply: (v) => [v * 0.453592, "kilograms"] },
  { from: /^(grams?|g)$/, apply: (v) => [v * 0.035274, "ounces"] },
  { from: /^(ounces?|oz)$/, apply: (v) => [v * 28.3495, "grams"] },
  { from: /^(liters?|litres?|l)$/, apply: (v) => [v * 0.264172, "gallons"] },
  { from: /^(gallons?|gal)$/, apply: (v) => [v * 3.78541, "liters"] },
];

function tryConversion(msg: string): string | null {
  // Celsius / Fahrenheit special-case
  const temp = msg.match(/(-?\d+(?:\.\d+)?)\s*(°\s?c|celsius|centigrade|°\s?f|fahrenheit)\s*(?:to|in|into)?\s*(°\s?f|fahrenheit|°\s?c|celsius|centigrade)?/);
  if (temp && temp[3]) {
    const v = parseFloat(temp[1]);
    const toF = /f/.test(temp[3]);
    const out = toF ? v * 1.8 + 32 : (v - 32) / 1.8;
    return `${v} degrees ${toF ? "Celsius" : "Fahrenheit"} is ${round(out)} degrees ${toF ? "Fahrenheit" : "Celsius"}.`;
  }

  const m = msg.match(/(-?\d+(?:\.\d+)?)\s*([a-z ]+?)\s*(?:to|in|into|as)\s*([a-z ]+)/i);
  if (!m) return null;
  const value = parseFloat(m[1]);
  const from = m[2].trim().toLowerCase();
  const to = m[3].trim().toLowerCase();
  for (const c of CONVERSIONS) {
    if (c.from.test(from)) {
      const [converted, unit] = c.apply(value);
      const matchesTarget =
        to.startsWith(unit.slice(0, 4)) || unit.startsWith(to.slice(0, 4)) || to === unit;
      if (matchesTarget) return `${value} ${from} is ${round(converted)} ${unit}.`;
    }
  }
  return null;
}

const FACTS: [string, string][] = [
  ["photosynthesis", "Photosynthesis is how green plants make food. They take in carbon dioxide and water, use sunlight captured by chlorophyll, and produce glucose and oxygen. In short: sunlight plus CO2 plus water gives glucose plus oxygen. Memorize it that way for the exam."],
  ["mitochondria", "Mitochondria are the powerhouse of the cell. They convert glucose and oxygen into ATP, the energy currency cells use to function. If a labeling question shows up, remember: double membrane, folded inner cristae, has its own DNA."],
  ["newton's law", "Newton's three laws: one, an object in rest or motion stays that way unless a force acts. Two, force equals mass times acceleration. Three, every action has an equal and opposite reaction. For numericals, F equals m a is your best friend."],
  ["ohm's law", "Ohm's law says voltage equals current times resistance, V equals I R. Double the voltage and you double the current, as long as resistance stays the same. Rearranged: I equals V over R, and R equals V over I."],
  ["periodic table", "The periodic table arranges all 118 elements by atomic number. Groups are vertical, periods are horizontal. Group one is alkali metals, group eighteen is noble gases, which barely react. Remember H O N C as the big four of organic chemistry."],
  ["water cycle", "The water cycle: evaporation, condensation, precipitation, collection. The sun heats water, vapor rises and cools into clouds, rain falls, rivers carry it back to the seas, and the loop continues."],
  ["atomic number", "The atomic number of an element is the number of protons in its nucleus, and it defines the element. Carbon is 6, oxygen is 8, sodium is 11, and gold is 79."],
  ["speed of light", "The speed of light in vacuum is about 299,792 kilometers per second, roughly 3 times 10 to the power 8 meters per second. Nothing with mass can reach it."],
  ["pythagoras", "Pythagoras theorem: in a right-angled triangle, the square of the hypotenuse equals the sum of the squares of the other two sides. a squared plus b squared equals c squared."],
  ["trigonometry", "Trigonometry quick recall: sine equals opposite over hypotenuse, cosine equals adjacent over hypotenuse, tan equals opposite over adjacent. SOH CAH TOA."],
  ["capital of india", "The capital of India is New Delhi."],
  ["largest planet", "The largest planet in our solar system is Jupiter. It's so big that more than 1300 Earths could fit inside it."],
  ["h2o", "H2O is the chemical formula for water: two hydrogen atoms bonded to one oxygen atom."],
];
