'use client';

import { useLeads } from '../../lib/useLeads';
import { STAGES } from '../../lib/demoData';
import DemoBanner from '../../components/DemoBanner';
import LeadCard from '../../components/LeadCard';

export default function PipelinePage() {
  const { mode, loading, leads, updateLead } = useLeads();

  if (loading) return <p className="muted">Loading pipeline…</p>;

  async function handleStageChange(id, stage) {
    try {
      await updateLead(id, { stage });
    } catch (error) {
      alert(error.message);
    }
  }

  return (
    <div>
      <h1>Pipeline</h1>
      <p className="sub">Move a lead to another stage with its dropdown. Open a lead for notes and follow-ups.</p>
      {mode === 'demo' ? <DemoBanner /> : null}

      <section className="board">
        {STAGES.map((stage) => {
          const column = leads.filter((lead) => lead.stage === stage);
          return (
            <div key={stage} className="column">
              <h3 className="column-title">
                {stage} <span>{column.length}</span>
              </h3>
              {column.length === 0 ? (
                <p className="muted">No leads.</p>
              ) : (
                column.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    showStageSelect
                    onStageChange={handleStageChange}
                  />
                ))
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
