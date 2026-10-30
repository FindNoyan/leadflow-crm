import { scoreLead } from '../lib/scoring';

const levelClass = {
  Hot: 'score-hot',
  Warm: 'score-warm',
  Cold: 'score-cold',
};

// Rule-based priority badge. The level and reason come from lib/scoring.js,
// which uses only stage, follow-up date, and note recency. No API call.
export default function ScoreBadge({ lead, showReason = false }) {
  const score = scoreLead(lead);
  return (
    <span>
      <span className={`tag ${levelClass[score.level] || 'score-cold'}`}>
        {score.level}
      </span>
      {showReason ? <span className="score-line">{score.reason}</span> : null}
    </span>
  );
}
