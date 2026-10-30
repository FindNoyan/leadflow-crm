'use client';

import { useMemo, useState } from 'react';
import { useLeads } from '../../lib/useLeads';
import { STAGES, SOURCES } from '../../lib/demoData';
import DemoBanner from '../../components/DemoBanner';
import LeadCard from '../../components/LeadCard';

const EMPTY_FORM = {
  name: '',
  company: '',
  city: '',
  source: 'LinkedIn',
  stage: 'New',
  service_needed: '',
  email: '',
  phone: '',
  follow_up_date: '',
};

export default function LeadsPage() {
  const { mode, loading, leads, createLead } = useLeads();
  const [query, setQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const sources = useMemo(() => {
    const found = new Set(leads.map((lead) => lead.source).filter(Boolean));
    return ['All', ...SOURCES.filter((source) => found.has(source)), ...[...found].filter((source) => !SOURCES.includes(source))];
  }, [leads]);

  const filtered = leads.filter((lead) => {
    const haystack = `${lead.name} ${lead.company} ${lead.city}`.toLowerCase();
    if (query && !haystack.includes(query.toLowerCase())) return false;
    if (stageFilter !== 'All' && lead.stage !== stageFilter) return false;
    if (sourceFilter !== 'All' && lead.source !== sourceFilter) return false;
    return true;
  });

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.name.trim()) {
      setFormError('Name is required.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await createLead({
        name: form.name.trim(),
        company: form.company.trim(),
        city: form.city.trim(),
        source: form.source,
        stage: form.stage,
        service_needed: form.service_needed.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        follow_up_date: form.follow_up_date || null,
      });
      setForm(EMPTY_FORM);
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="muted">Loading leads…</p>;

  return (
    <div>
      <h1>Leads</h1>
      <p className="sub">Search, filter, and add leads. Open a lead for notes and follow-ups.</p>
      {mode === 'demo' ? <DemoBanner /> : null}

      <div className="toolbar">
        <input
          className="input"
          type="search"
          placeholder="Search name, company, or city…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select className="select" value={stageFilter} onChange={(event) => setStageFilter(event.target.value)}>
          <option value="All">All stages</option>
          {STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {stage}
            </option>
          ))}
        </select>
        <select className="select" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
          {sources.map((source) => (
            <option key={source} value={source}>
              {source === 'All' ? 'All sources' : source}
            </option>
          ))}
        </select>
      </div>

      <section className="form-card">
        <h2>Add a lead</h2>
        {formError ? <p className="error">{formError}</p> : null}
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="field">
              <span>Name *</span>
              <input className="input" value={form.name} onChange={(event) => setField('name', event.target.value)} required />
            </label>
            <label className="field">
              <span>Company</span>
              <input className="input" value={form.company} onChange={(event) => setField('company', event.target.value)} />
            </label>
            <label className="field">
              <span>City</span>
              <input className="input" value={form.city} onChange={(event) => setField('city', event.target.value)} />
            </label>
            <label className="field">
              <span>Source</span>
              <select className="select" value={form.source} onChange={(event) => setField('source', event.target.value)}>
                {SOURCES.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Stage</span>
              <select className="select" value={form.stage} onChange={(event) => setField('stage', event.target.value)}>
                {STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Service needed</span>
              <input className="input" value={form.service_needed} onChange={(event) => setField('service_needed', event.target.value)} />
            </label>
            <label className="field">
              <span>Email</span>
              <input className="input" type="email" value={form.email} onChange={(event) => setField('email', event.target.value)} />
            </label>
            <label className="field">
              <span>Phone</span>
              <input className="input" value={form.phone} onChange={(event) => setField('phone', event.target.value)} />
            </label>
            <label className="field">
              <span>Follow-up date</span>
              <input className="input" type="date" value={form.follow_up_date} onChange={(event) => setField('follow_up_date', event.target.value)} />
            </label>
          </div>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Add lead'}
          </button>
        </form>
      </section>

      {filtered.length === 0 ? (
        <p className="muted">No leads match these filters.</p>
      ) : (
        filtered.map((lead) => <LeadCard key={lead.id} lead={lead} />)
      )}
    </div>
  );
}
