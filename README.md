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

### 4. Deploy on Vercel

1. Push this repo to GitHub and import it in Vercel (your own accounts).
2. In the Vercel project settings, add the same two environment variables
   (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`) with your
   own values.
3. Deploy. No other settings are needed.

## Project structure

```text
app/                  Next.js App Router pages (dashboard, leads, pipeline, auth)
app/leads/[id]/       Lead detail route (server wrapper + client detail view)
components/           Navbar, lead card, demo banner, lead detail
lib/                  Supabase client, demo data, leads hook (live + demo modes)
supabase/schema.sql   Tables + Row Level Security policies
```

## Notes and limits

- This scaffold has no tests, no email sending, and no AI features. Those
  were deliberately left out of the first version.
- Demo mode is a viewing aid, not a second database: nothing typed in demo
  mode is saved anywhere.
- If Supabase is configured but a table is missing (schema not run), lead
  operations will fail with a Supabase error shown on the page. Run
  `supabase/schema.sql` first.
