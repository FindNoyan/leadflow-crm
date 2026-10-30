// POST /api/ai/draft — generate a short outreach draft for one lead.
// The browser sends its Supabase access token in an Authorization header.
// The token is validated, and the lead is fetched as that user, so Row Level
// Security guarantees the lead belongs to them. The draft is returned for
// the user to copy, edit, and send themselves. The AI never sends a message.
// No user token, or no GEMINI_API_KEY, means a clearly labelled demo draft.

import { getUserClient, callGemini, demoDraft } from '../../../../lib/aiServer';
import { demoLeads } from '../../../../lib/demoData';

export async function POST(request) {
  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const leadId = typeof body.leadId === 'string' ? body.leadId : '';
  if (!leadId) {
    return Response.json({ error: 'A lead id is required.' }, { status: 400 });
  }

  const userClient = await getUserClient(request);
  const hasKey = Boolean(process.env.GEMINI_API_KEY);

  // Demo path: logged out, demo mode, or no Gemini key configured.
  if (!userClient || !hasKey) {
    const demoLead = demoLeads.find((lead) => lead.id === leadId);
    return Response.json(demoDraft(demoLead || null));
  }

  const { data: lead, error } = await userClient.supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();
  if (error || !lead) {
    return Response.json({ error: 'Lead not found.' }, { status: 404 });
  }

  const prompt = [
    'Write a short, friendly, personalized outreach message in English for WhatsApp or LinkedIn.',
    'Keep it to 3 to 5 sentences. Use the lead details below. Do not use placeholders like [Name].',
    'End with a simple question asking for a short call.',
    '',
    `Name: ${lead.name}`,
    `Company: ${lead.company || 'not recorded'}`,
    `City: ${lead.city || 'not recorded'}`,
    `Service needed: ${lead.service_needed || 'not recorded'}`,
    `Stage: ${lead.stage}`,
  ].join('\n');

  const draft = await callGemini(prompt);
  if (!draft) {
    return Response.json({
      draft:
        'The AI service could not write a draft right now. Please try again later.',
      demo: true,
    });
  }

  return Response.json({ draft, demo: false });
}
