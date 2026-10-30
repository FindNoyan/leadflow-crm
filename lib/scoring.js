// Deterministic, rule-based lead scoring. No API call, so it works in demo
// mode too. This is NOT model-judged: the level comes only from the rules
// below, in this order. Reasons are one line of plain English.
//
// Rules (first match wins):
// 1. Lost -> Cold. The deal is closed, no action needed.
// 2. Won -> Cold. The deal is won, no follow-up needed.
// 3. Follow-up date in the past -> Hot. The follow-up is overdue.
// 4. Stage Meeting -> Hot. A meeting means high intent.
// 5. Stage Replied with a note in the last 7 days -> Hot.
// 6. Stage Replied -> Warm.
// 7. Follow-up due within the next 3 days -> Warm.
// 8. Stage Contacted with a note in the last 7 days -> Warm.
// 9. Stage Contacted -> Cold. Contacted, but no recent activity.
// 10. Anything else (usually New) -> Cold. Set a follow-up date to
//     prioritize the lead.
//
// Note: in live mode the dashboard and pipeline lists do not load notes, so
// the note-recency rules only apply when notes are present on the lead
// object (demo mode, or the lead detail page).

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysUntil(dateString, now) {
  if (!dateString) return null;
  const target = startOfDay(new Date(dateString));
  const today = startOfDay(now);
  if (Number.isNaN(target.getTime())) return null;
  return Math.round((target - today) / DAY_MS);
}

function hasRecentNote(lead, now) {
  const notes = lead.notes || [];
  return notes.some((note) => {
    if (!note.created_at) return false;
    const created = new Date(note.created_at);
    if (Number.isNaN(created.getTime())) return false;
    return now - created <= 7 * DAY_MS && created <= now;
  });
}

export function scoreLead(lead, now = new Date()) {
  if (!lead) return { level: 'Cold', reason: 'No lead data to score.' };
  if (lead.stage === 'Lost') {
    return { level: 'Cold', reason: 'Closed lost. No follow-up needed.' };
  }
  if (lead.stage === 'Won') {
    return { level: 'Cold', reason: 'Deal won. No follow-up needed.' };
  }

  const dueIn = daysUntil(lead.follow_up_date, now);
  if (dueIn !== null && dueIn < 0) {
    return { level: 'Hot', reason: 'Follow-up overdue. Contact now.' };
  }
  if (lead.stage === 'Meeting') {
    return { level: 'Hot', reason: 'Meeting stage. Confirm the next step.' };
  }
  if (lead.stage === 'Replied' && hasRecentNote(lead, now)) {
    return { level: 'Hot', reason: 'Replied recently. Keep the conversation going.' };
  }
  if (lead.stage === 'Replied') {
    return { level: 'Warm', reason: 'Replied. Follow up to move it forward.' };
  }
  if (dueIn !== null && dueIn <= 3) {
    return { level: 'Warm', reason: 'Follow-up due within 3 days.' };
  }
  if (lead.stage === 'Contacted' && hasRecentNote(lead, now)) {
    return { level: 'Warm', reason: 'Contacted recently. Follow up soon.' };
  }
  if (lead.stage === 'Contacted') {
    return { level: 'Cold', reason: 'Contacted, but no recent activity.' };
  }
  return { level: 'Cold', reason: 'New lead. Set a follow-up date to prioritize it.' };
}
