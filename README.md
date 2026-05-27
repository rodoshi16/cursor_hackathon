# InterviewRadar

> **InterviewRadar does not just scan emails — it explains every decision it
> makes.**

InterviewRadar is a voice-first interview assistant for job seekers. It
connects to Gmail or Outlook, scans recent emails, classifies each one as
**Ignored / Needs Review / Added to Calendar**, and produces a transparent
**Decision Report** for every email. For confirmed interviews, the Decision
Report also includes an **Evidence-Based Prep Plan** you can listen to through
an ElevenLabs voice.

## Decision Reports

Every scanned email gets a Decision Report explaining:

- **Why** it was ignored, flagged, or added.
- **What evidence was found** — the exact phrases pulled from the email.
- **What actions were taken** — e.g. created calendar event, generated prep
  plan, marked as needs review.
- **What was not done** — e.g. did not invent interviewer name, did not add
  live coding prep because the email did not mention it.
- **What the user should do next.**

For confirmed interviews the report also includes an **Evidence-Based Prep
Plan** where every item is tied to a phrase from the recruiter email.

## The core rule — evidence-based reports

InterviewRadar **does not** hallucinate prep advice. Every recommendation in a
prep plan is tied to a phrase from the original recruiter email.

- If the email says "project showcase", the report helps you prepare that.
- If the email says "prepare a 10-minute presentation", that exact requirement
  is included.
- If the email says "implementation decisions", practicing implementation
  decisions is recommended.
- If the email only says "we would like to meet" with no clear format, the
  report just shows the confirmed details and lists missing details under
  Needs Clarification.

The detector deliberately avoids:

- Data structures / algorithms prep unless the email says technical, coding,
  software, engineer, or developer.
- STAR stories unless the email says behavioral, competency, leadership, or
  teamwork.
- Project showcase prep unless the email says project, showcase, presentation,
  demo, portfolio, or case study.
- Compensation prep unless the email mentions recruiter screen, HR, salary,
  compensation, or initial call.
- Company-values research unless the email mentions company fit, values,
  mission, culture, or why-this-company.
- System design unless the email mentions system design, architecture,
  backend, infrastructure, senior role, or design discussion.

## Demo mode

This MVP works without any external credentials. With
`NEXT_PUBLIC_DEMO_MODE=true` (the default in `.env.local`):

- `Scan All` returns three demo emails.
- Generic Google application confirmation → **Ignored** (Decision Report still
  generated, explaining why).
- Shopify final interview → **Added to calendar** (Decision Report + Evidence
  Based Prep Plan).
- Wealthsimple recruiter screen → **Needs review** — asked for availability,
  no exact time (Decision Report + Next Steps).
- Every email — including ignored ones — gets a Decision Report.
- No real OAuth or calendar API is required.
- The voice agent panel works without ElevenLabs credentials and shows the
  exact script that would be spoken.

Turn `NEXT_PUBLIC_DEMO_MODE` off to use real Gmail / Outlook accounts.

## Tech stack

- Next.js App Router + TypeScript
- Tailwind CSS
- Route Handlers under `app/api/*`
- `googleapis` for Gmail and Google Calendar
- Native `fetch` for Microsoft Graph
- ElevenLabs TTS + Conversational AI agent
- In-memory storage for the MVP

## Local run

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>. Click **View Demo** to land on the
dashboard.

## Environment variables

Create `.env.local` (or copy `.env.example`):

```bash
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_TENANT_ID=common
MICROSOFT_REDIRECT_URI=http://localhost:3000/api/auth/microsoft/callback

NEXT_PUBLIC_APP_URL=http://localhost:3000

ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
ELEVENLABS_AGENT_ID=

NEXT_PUBLIC_DEMO_MODE=true
```

All credentials are optional — missing ones simply degrade gracefully.

## Google setup

1. Create a Google Cloud project.
2. Enable the **Gmail API**.
3. Enable the **Google Calendar API**.
4. Create an OAuth client (type: **Web application**).
5. Add the redirect URI:
   `http://localhost:3000/api/auth/google/callback`.
6. Copy the client ID and secret into `.env.local`.

Requested scopes:

- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/calendar.events`
- `openid email profile`

## Microsoft setup

1. Create an **Azure App Registration**.
2. Add redirect URI: `http://localhost:3000/api/auth/microsoft/callback`.
3. Add delegated permissions:
   - `User.Read`
   - `Mail.Read`
   - `Calendars.ReadWrite`
   - `offline_access`
   - `openid`
   - `profile`
   - `email`
4. Create a client secret and copy it into `.env.local`.

## ElevenLabs setup

The `/agent` page is a real ElevenLabs Conversational AI voice loop — you press
**Start conversation**, talk to the agent, and it talks back, calling tools to
pull data from your inbox.

1. Get an [ElevenLabs API key](https://elevenlabs.io). Put it in
   `ELEVENLABS_API_KEY`.
2. (Optional) Choose a voice for read-aloud briefings and put the ID into
   `ELEVENLABS_VOICE_ID`.
3. Create a Conversational AI agent at
   [elevenlabs.io/app/conversational-ai](https://elevenlabs.io/app/conversational-ai)
   and put its agent ID into `ELEVENLABS_AGENT_ID`.
4. In the agent's **Prompt** field, paste the system prompt shown on the
   `/agent` setup screen (it enforces evidence-based answers). The same prompt
   is reproduced below for reference.
5. Add these **Client Tools** to the agent — they run in the browser and call
   InterviewRadar's `/api/tools/*` routes. The setup overlay on `/agent` has a
   one-click "Copy tools JSON" button:
   - `scan_inbox(provider?: "google" | "microsoft" | "all")`
   - `get_upcoming_interviews()`
   - `get_latest_decision_report()`
   - `get_decision_report(reportId: string)`
6. Restart `npm run dev`, open `/agent`, and press **Start conversation**.

### Agent system prompt

```text
You are InterviewRadar, a voice-first interview assistant for job seekers.
You help users find interview emails buried in Gmail or Outlook, add confirmed
interviews to their calendar, and prepare using evidence-based prep reports.

You can use tools to scan inboxes, fetch upcoming interviews, fetch prep
reports, summarize reports, and create calendar events.

Be concise, calm, and practical.

Never claim an interview exists unless the app tools found one.

Never create a calendar event unless the interview has a clear date and time.

Never invent prep advice.

Only summarize preparation items that are supported by the original email
evidence.

If an email seems interview-related but is missing a clear date or time, say
it needs review before being added to the calendar.

When summarizing a report, focus on:
- Confirmed interview details
- Evidence found in the email
- What the email specifically asks the candidate to prepare
- What is unclear
- Follow-up questions the candidate may want to ask

Tone: supportive, fast, clear, confident.
```

## Production notes

- The store is fully in-memory. Connected accounts, interviews, reports, and
  calendar events reset on server restart. Swap `lib/store.ts` for a real
  database before deploying.
- Gmail and Outlook tokens are short-lived. Add real refresh-token handling
  before production.
- The date parser handles common natural language but is best-effort. For
  production, consider an LLM extraction step that is still tied to email
  evidence.
- Never broaden the report generator to add generic prep tips — that breaks
  the product promise.
