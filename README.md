# LeadFlow CRM

A small CRM for tracking leads from first contact to won. Built with Next.js
(App Router), React, plain CSS, and Supabase (Postgres + Auth + Row Level
Security). No heavy UI dependencies, so a free Vercel deploy stays simple.

## What it does

- Dashboard with total leads and per-stage counts, plus recent leads.
- Leads list with search and stage/source filters, and an add-lead form.
- Pipeline kanban with 6 stages: New, Contacted, Replied, Meeting, Won, Lost.
  Move a lead with its stage dropdown.
- Lead detail page with contact info, stage, follow-up date, notes, and delete.
- Email sign-up and log-in via Supabase Auth.
- AI Assistant on the dashboard: ask about your own leads, and the answer
  comes only from your leads and notes (RAG v1, see below).
- AI outreach drafts on the lead detail page: a short personalized draft
  you copy, edit, and send yourself. The AI never sends a message.
- Rule-based lead scoring: every lead shows a Hot, Warm, or Cold badge with
  a one-line reason, computed from stage, follow-up date, and note recency.
  No API call is involved, so scoring works in demo mode too.
- Demo mode: a logged-out visitor, or an app without Supabase configured,
  sees clearly labelled demo data (12 sample leads). Demo changes are local
  only and are not saved. A logged-in user sees and manages only their own
  leads, enforced by Row Level Security.

## Routes

- `/` — dashboard with stats and recent leads
- `/leads` — leads list, search, filters, add-lead form
- `/leads/[id]` — lead detail with notes and follow-up date
- `/pipeline` — kanban board across the 6 stages
- `/login` — log in
- `/signup` — sign up
- `/api/ai/chat` — server-only AI Assistant route (answers from your own leads)
- `/api/ai/draft` — server-only outreach draft route (one lead at a time)

## Setup (honest steps, nothing hidden)

### 1. Install and run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. Without Supabase env vars, the app runs in demo
mode.

### 2. Create a Supabase project

1. Create a free project at Supabase (your own account, your own project).
2. Open the Supabase dashboard: SQL Editor, new query.
3. Paste the whole contents of `supabase/schema.sql` and run it. This creates
   the `leads` and `lead_notes` tables with Row Level Security policies so
   each user can only select, insert, update, and delete their own rows.
4. In Supabase: Project Settings, API, copy the Project URL and the anon
   public key. The anon key is designed to be public. Never put the
   service_role key in this app, in env vars, or in the repo.

### 3. Configure the app

```bash
cp .env.example .env.local
```

Fill in your own two values in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

`.env.local` is gitignored. `.env.example` contains placeholders only and no
real credentials. If Supabase Auth email confirmation is on (the default),
new accounts must confirm by email before they can log in; the sign-up page
says so after registration.

### 3b. Enable AI (optional, free tier)

The AI features need a free Gemini key, and only on the server:

1. Get a free key from Google AI Studio (your own Google account).
2. Locally, add it to `.env.local` as `GEMINI_API_KEY=your-key-here`.
3. On Vercel, add the same variable in Project Settings, Environment
   Variables, for Production, then redeploy.
4. Never share the key in chat, never put it in the repo, and never use a
   `NEXT_PUBLIC_` variable for it. Only the `app/api/ai/*` server routes
   read it.

Without a key, the app still works: the chat panel returns clearly labelled
demo answers and the draft button returns a clearly labelled demo draft.
Scoring needs no key at all.

### 4. Deploy on Vercel

1. Push this repo to GitHub and import it in Vercel (your own accounts).
2. In the Vercel project settings, add the same two environment variables
   (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`) with your
   own values, plus `GEMINI_API_KEY` if you want the AI features live.
3. Deploy. No other settings are needed.

## Project structure

```text
app/                  Next.js App Router pages (dashboard, leads, pipeline, auth)
app/leads/[id]/       Lead detail route (server wrapper + client detail view)
app/api/ai/           Server-only AI routes (chat, draft) — the only place
                      that reads GEMINI_API_KEY
components/           Navbar, lead card, demo banner, lead detail, AI chat,
                      score badge
lib/                  Supabase client, demo data, leads hook (live + demo
                      modes), rule-based scoring, server-only AI helpers
supabase/schema.sql   Tables + Row Level Security policies
```

## How the AI layer works (honest version)

- **AI Assistant (RAG v1):** the browser sends the question plus the user's
  Supabase access token to `/api/ai/chat`. The route validates the token
  with `supabase.auth.getUser`, then queries leads and notes as that user,
  so Row Level Security limits reads to their own rows. Retrieval in v1 is
  keyword/text matching over the user's own data, plus a small aggregate
  summary (totals, per-stage counts, overdue follow-ups). Gemini
  (gemini-2.0-flash, via server-side REST fetch) answers only from that
  retrieved data, names the leads it used, and says plainly when the data
  does not contain the answer. Vector embeddings are a possible future
  upgrade, not part of v1.
- **Outreach drafts:** `/api/ai/draft` validates the token, fetches that
  one lead as the user (RLS), and asks Gemini for a short personalized
  English draft. The draft is returned for the user to copy, edit, and send.
  The AI never sends any message.
- **Lead scoring:** deterministic rules in `lib/scoring.js` (stage,
  follow-up date, note recency). It is not model-judged and needs no key.
- **Demo behavior:** logged out, or no `GEMINI_API_KEY` configured, means
  clearly labelled demo answers and demo drafts instead of a failure.
  Demo data never leaves the demo: it is only used to illustrate the UI.

## Notes and limits

- This version has no tests and no email sending.
- Demo mode is a viewing aid, not a second database: nothing typed in demo
  mode is saved anywhere.
- If Supabase is configured but a table is missing (schema not run), lead
  operations will fail with a Supabase error shown on the page. Run
  `supabase/schema.sql` first.
