'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLeads } from '../lib/useLeads';
import { STAGES } from '../lib/demoData';

export default function LeadDetail({ leadId }) {
  const router = useRouter();
  const { mode, loading, leads, updateLead, deleteLead, addNote, getNotes } = useLeads();
  const [notes, setNotes] = useState([]);
  const [noteBody, setNoteBody] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const lead = leads.find((item) => item.id === leadId);

  useEffect(() => {
    if (!lead || mode === 'loading') return;
    if (mode === 'live') {
      getNotes(leadId).then(setNotes).catch(() => setNotes([]));
    } else {
      setNotes(lead.notes || []);
    }
  }, [lead, mode, leadId, getNotes]);

  if (loading) return <p className="muted">Loading lead…</p>;
  if (!lead) {
    return (
      <div>
        <p>Lead not found.</p>
        <Link href="/leads" className="btn btn-ghost">
          Back to leads
        </Link>
      </div>
    );
  }

  async function handleStageChange(event) {
    setFormError('');
    try {
      await updateLead(lead.id, { stage: event.target.value });
    } catch (error) {
      setFormError(error.message);
    }
  }

  async function handleFollowUpChange(event) {
    setFormError('');
    try {
      await updateLead(lead.id, { follow_up_date: event.target.value || null });
    } catch (error) {
      setFormError(error.message);
    }
  }

  async function handleAddNote(event) {
    event.preventDefault();
    if (!noteBody.trim()) return;
    setSaving(true);
    setFormError('');
    try {
      const note = await addNote(lead.id, noteBody.trim());
      if (mode === 'live') {
        setNotes((prev) => [...prev, note]);
      }
      setNoteBody('');
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this lead and its notes?')) return;
    setFormError('');
    try {
      await deleteLead(lead.id);
      router.push('/leads');
    } catch (error) {
      setFormError(error.message);
    }
  }

  return (
    <div>
      <Link href="/leads" className="muted">
        ← Back to leads
      </Link>
      <h1>{lead.name}</h1>
      <p className="sub">
        {lead.company}
        {lead.city ? `, ${lead.city}` : ''}
      </p>
      {formError ? <p className="error">{formError}</p> : null}

      <div className="detail-grid">
        <section className="form-card">
          <h2>Details</h2>
          <p>
            <strong>Source:</strong> {lead.source || 'Other'}
          </p>
          <p>
            <strong>Service needed:</strong> {lead.service_needed || '—'}
          </p>
          <p>
            <strong>Email:</strong> {lead.email || '—'}
          </p>
          <p>
            <strong>Phone:</strong> {lead.phone || '—'}
          </p>
          <label className="field">
            <span>Stage</span>
            <select className="select" value={lead.stage} onChange={handleStageChange}>
              {STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Follow-up date</span>
            <input
              className="input"
              type="date"
              value={lead.follow_up_date || ''}
              onChange={handleFollowUpChange}
            />
          </label>
          <button className="btn btn-danger" onClick={handleDelete}>
            Delete lead
          </button>
        </section>

        <section className="form-card">
          <h2>Notes</h2>
          {notes.length === 0 ? (
            <p className="muted">No notes yet.</p>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="note">
                <p>{note.body}</p>
                <span className="muted">
                  {note.created_at ? new Date(note.created_at).toLocaleString() : ''}
                </span>
              </div>
            ))
          )}
          <form onSubmit={handleAddNote} className="note-form">
            <textarea
              className="input"
              rows={3}
              value={noteBody}
              onChange={(event) => setNoteBody(event.target.value)}
              placeholder="Add a note, for example what was discussed and what to do next…"
              required
            />
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Add note'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
