import Link from 'next/link';
import { STAGES } from '../lib/demoData';

export default function LeadCard({ lead, showStageSelect, onStageChange }) {
  return (
    <div className="lead-card">
      <Link href={`/leads/${lead.id}`} className="lead-name">
        {lead.name}
      </Link>
      <p className="lead-meta">
        {lead.company}
        {lead.city ? `, ${lead.city}` : ''}
      </p>
      {lead.service_needed ? <p className="lead-meta">{lead.service_needed}</p> : null}
      <div className="lead-footer">
        <span className="tag">{lead.source || 'Other'}</span>
        {lead.follow_up_date ? (
          <span className="tag warm">Follow-up: {lead.follow_up_date}</span>
        ) : null}
      </div>
      {showStageSelect ? (
        <select
          className="select stage-select"
          value={lead.stage}
          onChange={(event) => onStageChange(lead.id, event.target.value)}
          aria-label={`Move ${lead.name} to stage`}
        >
          {STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {stage}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}
