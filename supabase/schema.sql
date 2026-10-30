-- LeadFlow CRM schema for Supabase (Postgres).
-- Run this whole file once in the Supabase dashboard: SQL Editor -> New query.
-- It assumes Supabase Auth is enabled. auth.users is managed by Supabase.
-- No data is inserted here; demo data lives only in the app (lib/demoData.js).

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  company text default '',
  city text default '',
  source text default 'Other',
  stage text not null default 'New'
    check (stage in ('New', 'Contacted', 'Replied', 'Meeting', 'Won', 'Lost')),
  service_needed text default '',
  email text default '',
  phone text default '',
  follow_up_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists leads_owner_id_idx on public.leads (owner_id);
create index if not exists leads_stage_idx on public.leads (stage);
create index if not exists lead_notes_lead_id_idx on public.lead_notes (lead_id);

-- Row Level Security: every user sees and changes only their own rows.
alter table public.leads enable row level security;
alter table public.lead_notes enable row level security;

drop policy if exists "leads_select_own" on public.leads;
create policy "leads_select_own" on public.leads
  for select using (auth.uid() = owner_id);

drop policy if exists "leads_insert_own" on public.leads;
create policy "leads_insert_own" on public.leads
  for insert with check (auth.uid() = owner_id);

drop policy if exists "leads_update_own" on public.leads;
create policy "leads_update_own" on public.leads
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "leads_delete_own" on public.leads;
create policy "leads_delete_own" on public.leads
  for delete using (auth.uid() = owner_id);

drop policy if exists "lead_notes_select_own" on public.lead_notes;
create policy "lead_notes_select_own" on public.lead_notes
  for select using (auth.uid() = owner_id);

drop policy if exists "lead_notes_insert_own" on public.lead_notes;
create policy "lead_notes_insert_own" on public.lead_notes
  for insert with check (
    auth.uid() = owner_id
    and exists (
      select 1 from public.leads
      where public.leads.id = lead_id
      and public.leads.owner_id = auth.uid()
    )
  );

drop policy if exists "lead_notes_update_own" on public.lead_notes;
create policy "lead_notes_update_own" on public.lead_notes
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "lead_notes_delete_own" on public.lead_notes;
create policy "lead_notes_delete_own" on public.lead_notes
  for delete using (auth.uid() = owner_id);
