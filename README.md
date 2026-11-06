# StudyHub — For Every Student

A community-driven, zero-cost platform where PG, graduate and undergraduate students
share links, files, folders, books and study notes — plus **StudyHub Assistant**, a
general-purpose **AI voice agent** you can talk to in the browser or have call your phone.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

No database or credentials are required: with `DATABASE_URL` unset, the app uses an
embedded in-memory Postgres (PGlite) auto-created and seeded with starter NCERT resources.
Set `DATABASE_URL` in `.env` to use your own Postgres instead.

## The AI voice agent

### 1. Talk to it in the browser — works out of the box
Open **`/call`** (or tap **Call Agent** in the navbar) and press the green button.
Your browser listens (Web Speech API), the agent thinks (via `/api/agent/chat`),
and answers **out loud** (speech synthesis). Includes live transcript, mute,
call timer, capability chips and a type-to-ask fallback for browsers without
speech recognition. Best experienced in Chrome/Edge.

### 2. Get a real phone call from the agent (outbound)
On the `/call` page, enter your number in **"Get a Call on Your Phone"** and press
**Call me**. Your phone rings over a normal line; the agent greets you and has a
spoken conversation (Twilio `<Gather input="speech">` loop → same brain → `<Say>`).

Enable it once:

1. Create an account at [twilio.com](https://www.twilio.com) and verify your own number.
2. From the [Twilio Console](https://console.twilio.com), copy **Account SID** and **Auth Token**.
3. Buy/claim a Twilio phone number (free trial numbers work).
4. Add to `.env`:
   ```
   TWILIO_ACCOUNT_SID=ACxxxx…
   TWILIO_AUTH_TOKEN=xxxx…
   TWILIO_FROM_NUMBER=+12025550123
   ```
5. Restart the app → open `/call` → enter your number → **Call me**.

> Trial accounts can only call **verified** numbers and play a short trial announcement first.
> The Twilio webhook URL used is `<your origin>/api/twiml` (auto-detected from the request).

### 3. Smarter replies (optional)
Without any keys, the agent uses a built-in offline brain: study Q&A (photosynthesis,
Newton's laws, Ohm's law, periodic table…), arithmetic (`25 times 17`), unit
conversions (`10 km to miles`), time/date, study tips, motivation and jokes, plus
full help for the StudyHub app itself.
To upgrade to a full LLM, set any OpenAI-compatible endpoint in `.env`:

```
LLM_API_KEY=sk-…
LLM_BASE_URL=https://api.openai.com/v1   # or Groq/OpenRouter/etc.
LLM_MODEL=gpt-4o-mini
```

## API surface

| Route | Purpose |
| --- | --- |
| `POST /api/agent/chat` | `{ message, history? }` → `{ reply, source }` |
| `GET/POST /api/call-me` | Config status / place outbound Twilio call `{ phone }` |
| `GET/POST /api/twiml` | TwiML greeting + speech gather (entry point of the phone call) |
| `POST /api/twiml/gather` | TwiML speech loop — agent replies and keeps listening |
| `GET/POST /api/resources` | List / add shared resources |
| `GET/POST /api/planner` | List / add study-planner tasks |
| `GET /api/health` | Health check |

## Scripts

`npm run dev` · `npm run build` · `npm start` · `npm run lint` · `npm run typecheck`

## Notes

- Voice is synthesized with the browser/Twilio built-in voices (Indian-English, `en-IN`).
- Your phone number is used once to place the call and is never stored.
- Tech: Next.js 16, React 19, Tailwind 4, Drizzle ORM, PGlite/Postgres.
