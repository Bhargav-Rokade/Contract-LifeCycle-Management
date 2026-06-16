import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { negotiationsApi } from '../api/negotiations';
import type { NegotiationDeck } from '../types';
import { useAuthStore } from '../store/authStore';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function DashboardPage() {
  const [decks, setDecks] = useState<NegotiationDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { company } = useAuthStore();

  useEffect(() => {
    negotiationsApi.list().then(res => {
      setDecks(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Negotiations</h1>
            <p className="page-subtitle">All active negotiation decks involving {company?.display_name}.</p>
          </div>
          <button id="new-negotiation-btn" className="btn btn-primary" onClick={() => navigate('/negotiations/new')}>
            + New Negotiation
          </button>
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <div className="empty-state">
            <span className="loading-spinner loading-spinner-dark" />
          </div>
        ) : decks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">⇌</div>
            <div className="empty-state-title">No negotiations yet</div>
            <div className="empty-state-body">
              Create a new negotiation deck to begin exchanging contract revisions with a counterparty.
            </div>
            <button className="btn btn-primary" onClick={() => navigate('/negotiations/new')}>
              Start a Negotiation
            </button>
          </div>
        ) : (
          <div className="card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Party A</th>
                  <th>Party B</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {decks.map(deck => (
                  <tr key={deck.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/negotiations/${deck.id}`)}>
                    <td>
                      <span style={{ fontWeight: 500, color: 'var(--color-ink)' }}>{deck.title}</span>
                    </td>
                    <td>
                      <span className="font-mono text-xs">{deck.company_a.company_handle}</span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-ink-3)' }}>{deck.company_a.display_name}</div>
                    </td>
                    <td>
                      <span className="font-mono text-xs">{deck.company_b.company_handle}</span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-ink-3)' }}>{deck.company_b.display_name}</div>
                    </td>
                    <td className="text-muted text-sm">{formatDate(deck.created_at)}</td>
                    <td>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={(e) => { e.stopPropagation(); navigate(`/negotiations/${deck.id}`); }}
                      >
                        Open →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
