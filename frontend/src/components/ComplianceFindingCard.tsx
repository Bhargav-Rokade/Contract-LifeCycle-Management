import type { ComplianceFinding } from '../types';

const BADGE_MAP: Record<string, { label: string; cls: string }> = {
  potential_conflict:         { label: 'Potential Conflict',   cls: 'badge-conflict' },
  policy_alignment:           { label: 'Policy Alignment',     cls: 'badge-aligned'  },
  manual_review_recommended:  { label: 'Manual Review',        cls: 'badge-manual'   },
};

export function ComplianceFindingCard({ finding }: { finding: ComplianceFinding }) {
  const badge = BADGE_MAP[finding.finding_type] ?? { label: finding.finding_type, cls: 'badge-info' };

  return (
    <div className="finding-card">
      <div className="finding-card-header">
        <span className={`badge ${badge.cls}`}>{badge.label}</span>
        <span className="text-xs text-muted" style={{ marginLeft: 'auto', flexShrink: 0 }}>
          {finding.policy_reference}
        </span>
      </div>
      <div className="finding-card-body">
        <div className="finding-policy-ref-label">Changed Clause</div>
        <div className="finding-clause">{finding.clause_text || '(no content)'}</div>

        <div className="finding-policy-ref-label" style={{ marginTop: '12px' }}>Analysis</div>
        <p className="finding-summary">{finding.summary}</p>

        <div className="finding-policy-reference">
          <div className="finding-policy-ref-label">Policy Reference — {finding.policy_reference}</div>
          <div className="finding-policy-excerpt">{finding.policy_excerpt}</div>
        </div>
      </div>
    </div>
  );
}
