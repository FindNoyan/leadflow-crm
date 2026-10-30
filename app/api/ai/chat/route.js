// POST /api/ai/chat — AI Assistant (RAG v1) over the user's own leads.
// The browser sends its Supabase access token in an Authorization header.
// The token is validated with supabase.auth.getUser, and all data queries
// run as that user, so Row Level Security limits reads to their own rows.
// No user token, or no GEMINI_API_KEY, means a clearly labelled demo answer
// instead of a failure. The Gemini key is server-only and never leaves this
// route.

import {
  getUserClient,
  fetchUserLeadsWithNotes,
  summarizeLeads,
  retrieveRelevant,
  formatLeadForPrompt,
  callGemini,
  demoChatAnswer,
} from '../../../../lib/aiServer';
import { demoLeads } from '../../../../lib/demoData';

export async function POST(request) {
  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const question = typeof body.question === 'string' ? body.question.trim() : '';
  if (!question) {
    return Response.json({ error: 'Please ask a question.' }, { status: 400 });
  }

  const userClient = await getUserClient(request);
  const hasKey = Boolean(process.env.GEMINI_API_KEY);

  // Demo path: logged out, demo mode, or no Gemini key configured.
  if (!userClient || !hasKey) {
    return Response.json({
      answer: demoChatAnswer(question),
      sources: [],
      demo: true,
    });
  }

  const leads = await fetchUserLeadsWithNotes(userClient.supabase);
  const summary = summarizeLeads(leads);
  const relevant = retrieveRelevant(leads, question, 6);

  const prompt = [
    'You are a helpful assistant inside a small CRM. Answer ONLY from the lead data below.',
    'If the data does not contain the answer, say plainly that it does not contain it. Never invent a lead, a date, or a detail.',
    'When you mention a lead, name it so the user can check it.',
    '',
    `Summary of all leads: ${summary.total} total. Stages: ${Object.entries(summary.counts)
      .map(([stage, count]) => `${stage} ${count}`)
      .join(', ')}. Overdue follow-ups: ${summary.overdue}.`,
    '',
    relevant.length > 0
      ? `Most relevant leads for this question:\n\n${relevant.map(formatLeadForPrompt).join('\n\n')}`
      : 'No lead matched the question by keyword. Answer only from the summary above, or say the data does not contain the answer.',
    '',
    `Question: ${question}`,
  ].join('\n');

  const answer = await callGemini(prompt);
  if (!answer) {
    return Response.json({
      answer:
        'The AI service could not answer right now. Please try again later. ' +
        'Your leads were not changed.',
      sources: [],
      demo: true,
    });
  }

  return Response.json({
    answer,
    sources: relevant.map((lead) => ({ id: lead.id, name: lead.name })),
    demo: false,
  });
}
