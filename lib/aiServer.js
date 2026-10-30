// Server-only helpers for the AI routes (app/api/ai/*). This file must never
// be imported by a client component: it reads the server env var
// GEMINI_API_KEY, which must never reach the browser. The browser only ever
// sends its own Supabase access token, and only to these routes.
//
// Security flow for every AI request:
// 1. The browser sends its Supabase access token in an Authorization header.
// 2. The route validates the token with supabase.auth.getUser(token). An
//    invalid or missing token means no live data access.
// 3. For live data, the route builds a Supabase client that sends the user's
//    token with every query, so the leads and lead_notes Row Level Security
//    policies apply: a user can only read their own rows. The service_role
//    key is never used anywhere in this app.

import { createClient } from '@supabase/supabase-js';
import { demoLeads } from './demoData';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate a user's access token and return a Supabase client that queries
// as that user (RLS applies). Returns null when the token is missing,
// invalid, or Supabase is not configured.
export async function getUserClient(request) {
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
  if (!token || !supabaseUrl || !supabaseAnonKey) return null;

  const authClient = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data?.user) return null;

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  return { user: data.user, supabase: userClient };
}

// Fetch one user's leads with their notes, through RLS.
export async function fetchUserLeadsWithNotes(userClient) {
  const { data: leads, error } = await userClient
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error || !leads) return [];
  const ids = leads.map((lead) => lead.id);
  if (ids.length === 0) return leads;
  const { data: notes } = await userClient
    .from('lead_notes')
    .select('*')
    .in('lead_id', ids)
    .order('created_at', { ascending: true });
  const byLead = {};
  (notes || []).forEach((note) => {
    if (!byLead[note.lead_id]) byLead[note.lead_id] = [];
    byLead[note.lead_id].push(note);
  });
  return leads.map((lead) => ({ ...lead, notes: byLead[lead.id] || [] }));
}

// Small aggregate summary, always included in the chat prompt so aggregate
// questions ("how many leads do I have?") work even when no lead matches a
// keyword.
export function summarizeLeads(leads) {
  const counts = {};
  leads.forEach((lead) => {
    counts[lead.stage] = (counts[lead.stage] || 0) + 1;
  });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdue = leads.filter(
    (lead) =>
      lead.follow_up_date &&
      lead.stage !== 'Won' &&
      lead.stage !== 'Lost' &&
      new Date(lead.follow_up_date) < today,
  ).length;
  return { total: leads.length, counts, overdue };
}

const STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'do', 'does', 'did', 'what',
  'which', 'who', 'whom', 'how', 'many', 'much', 'show', 'list', 'tell',
  'me', 'my', 'i', 'we', 'you', 'of', 'for', 'to', 'in', 'on', 'at', 'and',
  'or', 'any', 'all', 'have', 'has', 'there', 'about', 'lead', 'leads',
]);

// v1 retrieval: keyword/text matching over the user's own data. No vector
// embeddings in v1; that is a possible future upgrade, not part of this
// version. Terms are matched against name, company, city, service needed,
// stage, source, and note text. A few intent words get a boost: "follow-up"
// favours leads with a follow-up date, "overdue" favours overdue leads.
export function retrieveRelevant(leads, question, limit = 6) {
  const terms = (question || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 2 && !STOPWORDS.has(term));
  const wantsFollowUp = /follow[- ]?up/.test((question || '').toLowerCase());
  const wantsOverdue = /overdue|late|missed/.test((question || '').toLowerCase());
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const scored = leads.map((lead) => {
    const haystack = [
      lead.name,
      lead.company,
      lead.city,
      lead.service_needed,
      lead.stage,
      lead.source,
      ...(lead.notes || []).map((note) => note.body),
    ]
      .join(' ')
      .toLowerCase();
    let score = 0;
    terms.forEach((term) => {
      if (haystack.includes(term)) score += 1;
    });
    if (wantsFollowUp && lead.follow_up_date) score += 2;
    if (
      wantsOverdue &&
      lead.follow_up_date &&
      lead.stage !== 'Won' &&
      lead.stage !== 'Lost' &&
      new Date(lead.follow_up_date) < today
    ) {
      score += 3;
    }
    return { lead, score };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        new Date(b.lead.created_at) - new Date(a.lead.created_at),
    )
    .slice(0, limit)
    .map((item) => item.lead);
}

export function formatLeadForPrompt(lead) {
  const notes = (lead.notes || []).map((note) => `- ${note.body}`).join('\n');
  return [
    `${lead.name} (${lead.company || 'no company'}${lead.city ? `, ${lead.city}` : ''})`,
    `Stage: ${lead.stage}, source: ${lead.source || 'Other'}, service needed: ${lead.service_needed || 'not recorded'}`,
    lead.follow_up_date ? `Follow-up date: ${lead.follow_up_date}` : 'No follow-up date set',
    notes ? `Notes:\n${notes}` : 'No notes',
  ].join('\n');
}

// Call Gemini with a plain server-side fetch. No new dependency. The key
// travels only in the x-goog-api-key header, never in a URL. Returns the
// generated text, or null when the key is missing or the call fails.
export async function callGemini(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': key,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      },
    );
    if (!response.ok) return null;
    const json = await response.json();
    const text = json?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || '')
      .join('')
      .trim();
    return text || null;
  } catch {
    return null;
  }
}

// Clearly labelled demo answers, used when there is no user token or no
// Gemini key. These come from the demo data only and never pretend to be
// model output.
export function demoChatAnswer(question, leads = demoLeads) {
  const q = (question || '').toLowerCase();
  const label = 'Demo answer — AI is not configured, so this comes from demo data, not from Gemini. ';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAhead = new Date(today);
  weekAhead.setDate(weekAhead.getDate() + 7);

  if (/follow[- ]?up/.test(q)) {
    const due = leads.filter((lead) => {
      if (!lead.follow_up_date) return false;
      const d = new Date(lead.follow_up_date);
      return d >= today && d <= weekAhead;
    });
    if (due.length === 0) {
      return `${label}No demo lead has a follow-up date in the next 7 days.`;
    }
    const names = due
      .map((lead) => `${lead.name} (${lead.company}, follow-up ${lead.follow_up_date})`)
      .join('; ');
    return `${label}These demo leads have a follow-up in the next 7 days: ${names}.`;
  }

  const summary = summarizeLeads(leads);
  const stageParts = Object.entries(summary.counts)
    .map(([stage, count]) => `${count} ${stage}`)
    .join(', ');
  return (
    `${label}You have ${summary.total} demo leads: ${stageParts}. ` +
    `${summary.overdue} have an overdue follow-up. ` +
    'Ask about follow-ups or a stage, or sign in with a configured Gemini key for full AI answers.'
  );
}

export function demoDraft(lead) {
  const name = lead?.name || 'there';
  const company = lead?.company ? ` at ${lead.company}` : '';
  const service = lead?.service_needed || 'your project';
  return {
    draft:
      `Hi ${name}, I came across your work${company} and wanted to reach out about ${service}. ` +
      `I help small businesses with work like this, and I would be glad to show you a short example of what it could look like for you. ` +
      `Would a 15-minute call this week work for you?`,
    demo: true,
  };
}
