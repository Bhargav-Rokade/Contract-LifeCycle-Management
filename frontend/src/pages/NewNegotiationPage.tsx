import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { negotiationsApi } from '../api/negotiations';
import type { Company } from '../types';

export function NewNegotiationPage() {
  const [title, setTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Company[]>([]);
  const [selected, setSelected] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!searchQuery.trim() || selected) {
      setResults([]);
      return;
    }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await negotiationsApi.searchCompanies(searchQuery);
        setResults(res.data);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [searchQuery, selected]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) { setError('Select a counterparty to proceed.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await negotiationsApi.create({ title, counterparty_handle: selected.company_handle });
      navigate(`/negotiations/${res.data.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Failed to create negotiation.');
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">New Negotiation</h1>
          <p className="page-subtitle">Initiate a new contract negotiation with a counterparty.</p>
        </div>
      </div>

      <div className="page-body">
        <div className="card" style={{ maxWidth: '560px' }}>
          <div className="card-header">
            <span className="card-title">Negotiation Details</span>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="form-group">
                <label className="form-label">Negotiation Title</label>
                <input
                  id="neg-title"
                  className="form-input"
                  type="text"
                  placeholder="e.g. Master Services Agreement 2025"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Counterparty</label>
                {selected ? (
                  <div className="flex items-center gap-3" style={{ padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', background: 'var(--color-accent-light)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{selected.display_name}</div>
                      <div className="font-mono text-xs text-muted">@{selected.company_handle}</div>
                    </div>
                    <button type="button" className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => { setSelected(null); setSearchQuery(''); }}>
                      Change
                    </button>
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <input
                      id="neg-counterparty-search"
                      className="form-input"
                      type="text"
                      placeholder="Search by company handle or name…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {(results.length > 0 || loading) && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-md)', marginTop: '4px' }}>
                        {loading ? (
                          <div style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--color-ink-3)' }}>Searching…</div>
                        ) : results.map(c => (
                          <div
                            key={c.id}
                            style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid var(--color-border)', transition: 'background 0.1s' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-2)')}
                            onMouseLeave={e => (e.currentTarget.style.background = '')}
                            onClick={() => { setSelected(c); setSearchQuery(''); setResults([]); }}
                          >
                            <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{c.display_name}</div>
                            <div className="font-mono text-xs text-muted">@{c.company_handle}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <span className="form-hint">Search for the counterparty by their registered company handle.</span>
              </div>

              {error && <div className="error-text">{error}</div>}

              <div className="flex gap-3">
                <button id="create-neg-submit" className="btn btn-primary" type="submit" disabled={submitting || !selected}>
                  {submitting ? <span className="loading-spinner" /> : 'Create Negotiation'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => navigate('/dashboard')}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
