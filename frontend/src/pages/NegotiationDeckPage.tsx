import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { DiffViewer } from '../components/DiffViewer';
import { ComplianceFindingCard } from '../components/ComplianceFindingCard';
import { negotiationsApi } from '../api/negotiations';
import { revisionsApi } from '../api/revisions';
import { complianceApi } from '../api/compliance';
import type { NegotiationDeck, ContractRevision, DiffResponse, ComplianceFinding } from '../types';
import { useAuthStore } from '../store/authStore';

function timeAgo(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

type Tab = 'diff' | 'compliance';

export function NegotiationDeckPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { company } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const [deck, setDeck] = useState<NegotiationDeck | null>(null);
  const [revisions, setRevisions] = useState<ContractRevision[]>([]);
  const [selectedRev, setSelectedRev] = useState<ContractRevision | null>(null);
  const [diff, setDiff] = useState<DiffResponse | null>(null);
  const [findings, setFindings] = useState<ComplianceFinding[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('diff');
  const [uploading, setUploading] = useState(false);
  const [loadingDiff, setLoadingDiff] = useState(false);
  const [runningCompliance, setRunningCompliance] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [error, setError] = useState('');

  const fetchRevisions = () => {
    if (!deckId) return;
    revisionsApi.list(deckId).then(res => {
      setRevisions(res.data);
      if (res.data.length > 0 && !selectedRev) {
        selectRevision(res.data[0]);
      }
    });
  };

  useEffect(() => {
    if (!deckId) return;
    negotiationsApi.get(deckId).then(res => setDeck(res.data));
    fetchRevisions();
  }, [deckId]);

  const selectRevision = async (rev: ContractRevision) => {
    setSelectedRev(rev);
    setDiff(null);
    setFindings([]);
    setActiveTab('diff');
    setLoadingDiff(true);
    try {
      const [diffRes, findingsRes] = await Promise.all([
        revisionsApi.getDiff(deckId!, rev.id),
        complianceApi.getFindings(deckId!, rev.id),
      ]);
      setDiff(diffRes.data);
      setFindings(findingsRes.data);
    } finally {
      setLoadingDiff(false);
    }
  };

  const handleUpload = async (file: File) => {
    if (!deckId) return;
    setUploading(true);
    setError('');
    try {
      await revisionsApi.upload(deckId, file, commitMessage || 'Uploaded revised contract');
      setShowUpload(false);
      setCommitMessage('');
      fetchRevisions();
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleRunCompliance = async () => {
    if (!selectedRev || !deckId) return;
    setRunningCompliance(true);
    setError('');
    try {
      const res = await complianceApi.run(deckId, selectedRev.id);
      setFindings(res.data);
      setActiveTab('compliance');
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Compliance run failed.');
    } finally {
      setRunningCompliance(false);
    }
  };

  const handleDownload = async () => {
    if (!deckId) return;
    setDownloading(true);
    try {
      const res = await revisionsApi.downloadLatest(deckId);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${deck?.title.replace(/\s/g, '_')}_latest.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const counterparty = deck
    ? (deck.company_a.id === company?.id ? deck.company_b : deck.company_a)
    : null;

  return (
    <Layout>
      {/* Top bar */}
      <div style={{ padding: '16px 32px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div className="flex items-center gap-4">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')} style={{ color: 'var(--color-ink-3)' }}>
            ← Back
          </button>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem' }}>
              {deck?.title ?? '…'}
            </div>
            {counterparty && (
              <div style={{ fontSize: '0.75rem', color: 'var(--color-ink-3)' }}>
                Counterparty: <span className="font-mono">{counterparty.company_handle}</span> · {counterparty.display_name}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          {revisions.length > 0 && (
            <button id="download-docx-btn" className="btn btn-outline btn-sm" onClick={handleDownload} disabled={downloading}>
              {downloading ? <span className="loading-spinner loading-spinner-dark" /> : '↓ Download DOCX'}
            </button>
          )}
          <button id="upload-revision-btn" className="btn btn-primary btn-sm" onClick={() => setShowUpload(v => !v)}>
            ↑ Upload Revision
          </button>
        </div>
      </div>

      {/* Upload panel */}
      {showUpload && (
        <div style={{ padding: '16px 32px', background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-3">
            <input
              className="form-input"
              type="text"
              placeholder="Revision note (optional)"
              value={commitMessage}
              onChange={e => setCommitMessage(e.target.value)}
              style={{ width: '320px' }}
            />
            <input ref={fileRef} type="file" accept=".docx" hidden onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ''; }} />
            <button id="select-file-btn" className="btn btn-primary btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <><span className="loading-spinner" /> Uploading…</> : 'Select DOCX…'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowUpload(false)}>Cancel</button>
          </div>
          {error && <div className="error-text mt-4">{error}</div>}
        </div>
      )}

      {/* Body: sidebar + content */}
      <div className="deck-layout" style={{ height: `calc(100vh - ${showUpload ? '146px' : '88px'})` }}>
        {/* Revision sidebar */}
        <div className="deck-sidebar">
          <div className="deck-sidebar-header">Revision History ({revisions.length})</div>
          {revisions.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 16px' }}>
              <div className="empty-state-icon" style={{ fontSize: '1.4rem' }}>○</div>
              <div className="empty-state-title" style={{ fontSize: '0.85rem' }}>No revisions yet</div>
              <div className="empty-state-body" style={{ fontSize: '0.78rem' }}>Upload the first draft to begin tracking.</div>
            </div>
          ) : (
            <div className="timeline" style={{ padding: '8px' }}>
              {revisions.map((rev, idx) => (
                <div
                  key={rev.id}
                  className={`timeline-item ${selectedRev?.id === rev.id ? 'selected' : ''}`}
                  onClick={() => selectRevision(rev)}
                >
                  <div className="timeline-dot" />
                  <div style={{ minWidth: 0 }}>
                    <div className="timeline-message" style={{ fontSize: '0.8rem' }}>
                      {rev.commit_message}
                    </div>
                    <div className="timeline-author">@{rev.author_company.company_handle}</div>
                    <div className="timeline-meta">{timeAgo(rev.created_at)}</div>
                    {idx === 0 && (
                      <span className="badge badge-aligned" style={{ marginTop: '4px', fontSize: '0.65rem', padding: '2px 6px' }}>Latest</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {selectedRev ? (
            <>
              {/* Tabs */}
              <div className="deck-tabs">
                <button className={`deck-tab ${activeTab === 'diff' ? 'active' : ''}`} onClick={() => setActiveTab('diff')}>
                  Changes
                </button>
                <button className={`deck-tab ${activeTab === 'compliance' ? 'active' : ''}`} onClick={() => setActiveTab('compliance')}>
                  Compliance {findings.length > 0 && <span className="badge badge-conflict" style={{ marginLeft: '6px', fontSize: '0.65rem', padding: '1px 6px' }}>{findings.length}</span>}
                </button>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', paddingRight: '16px' }}>
                  <button
                    id="run-compliance-btn"
                    className="btn btn-outline btn-sm"
                    onClick={handleRunCompliance}
                    disabled={runningCompliance}
                    style={{ fontSize: '0.78rem' }}
                  >
                    {runningCompliance ? <><span className="loading-spinner loading-spinner-dark" /> Analysing…</> : '⊕ Run Compliance Review'}
                  </button>
                </div>
              </div>

              <div className="deck-main">
                {activeTab === 'diff' && (
                  <>
                    <div style={{ marginBottom: '12px', fontSize: '0.78rem', color: 'var(--color-ink-3)' }}>
                      Showing changes introduced in revision <span className="font-mono">{selectedRev.commit_hash.slice(0, 7)}</span> by <span className="font-mono">@{selectedRev.author_company.company_handle}</span>
                    </div>
                    {loadingDiff ? (
                      <div className="empty-state"><span className="loading-spinner loading-spinner-dark" /></div>
                    ) : diff ? (
                      <DiffViewer diff={diff} />
                    ) : null}
                  </>
                )}

                {activeTab === 'compliance' && (
                  <>
                    {error && <div className="alert alert-error mb-4">{error}</div>}
                    {findings.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-state-icon">⊞</div>
                        <div className="empty-state-title">No compliance findings</div>
                        <div className="empty-state-body">
                          Run a compliance review to evaluate this revision against your knowledge base.
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {findings.map(f => <ComplianceFindingCard key={f.id} finding={f} />)}
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ flex: 1 }}>
              <div className="empty-state-icon">⇌</div>
              <div className="empty-state-title">Select a revision</div>
              <div className="empty-state-body">Choose a revision from the history panel to view changes and run compliance checks.</div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
