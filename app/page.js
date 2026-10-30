'use client';

import Link from 'next/link';
import { useLeads } from '../lib/useLeads';
import { STAGES } from '../lib/demoData';
import DemoBanner from '../components/DemoBanner';
import LeadCard from '../components/LeadCard';
import AiChat from '../components/AiChat';

export default function DashboardPage() {
  const { mode, loading, leads } = useLeads();

  if (loading) return <p className="muted">Loading dashboard…</p>;

  const counts = {};
  STAGES.forEach((stage) => {
    counts[stage] = leads.filter((lead) => lead.stage === stage).length;
  });
  const recent = [...leads]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  return (
    <div>
      <h1>Dashboard</h1>
      <p className="sub">Every lead, from first contact to won, in one pipeline.</p>
      {mode === 'demo' ? <DemoBanner /> : null}

      <section className="stats-grid">
        <Link href="/leads" className="stat-card">
          <div className="stat-num">{leads.length}</div>
          <div className="stat-label">Total leads</div>
        </Link>
        {STAGES.map((stage) => (
          <Link key={stage} href="/pipeline" className="stat-card">
            <div className="stat-num">{counts[stage]}</div>
            <div className="stat-label">{stage}</div>
          </Link>
        ))}
      </section>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <Link href="/leads" className="btn btn-primary">
          View all leads
        </Link>
        <Link href="/pipeline" className="btn btn-ghost">
          Open pipeline
        </Link>
      </div>

      <AiChat />

      <h2>Recent leads</h2>
      {recent.length === 0 ? (
        <p className="muted">No leads yet. Add your first lead on the Leads page.</p>
      ) : (
        recent.map((lead) => <LeadCard key={lead.id} lead={lead} />)
      )}
    </div>
  );
}
