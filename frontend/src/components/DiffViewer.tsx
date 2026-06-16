import type { DiffResponse } from '../types';

export function DiffViewer({ diff }: { diff: DiffResponse }) {
  if (!diff.segments || diff.segments.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">≡</div>
        <div className="empty-state-title">No Changes Detected</div>
        <div className="empty-state-body">This revision is identical to the previous version.</div>
      </div>
    );
  }

  return (
    <div className="diff-viewer">
      {diff.segments.map((seg, i) => {
        const lineClass =
          seg.type === 'addition' ? 'diff-line-addition' :
          seg.type === 'deletion' ? 'diff-line-deletion' :
          seg.content.startsWith('@@') ? 'diff-line-meta' :
          'diff-line-unchanged';

        return (
          <div key={i} className={`diff-line ${lineClass}`}>
            <span style={{ userSelect: 'none', marginRight: '12px', opacity: 0.5, flexShrink: 0 }}>
              {seg.type === 'addition' ? '+' : seg.type === 'deletion' ? '−' : ' '}
            </span>
            <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{seg.content}</span>
          </div>
        );
      })}
    </div>
  );
}
