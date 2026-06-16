import { useEffect, useRef, useState } from 'react';
import { Layout } from '../components/Layout';
import { kbApi } from '../api/kb';
import type { KBDocument, KBStatus } from '../types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function KnowledgeBasePage() {
  const [docs, setDocs] = useState<KBDocument[]>([]);
  const [status, setStatus] = useState<KBStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [rebuildResult, setRebuildResult] = useState<string | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([kbApi.listDocuments(), kbApi.status()]).then(([docsRes, statusRes]) => {
      setDocs(docsRes.data);
      setStatus(statusRes.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError('');
    try {
      await kbApi.uploadDocument(file);
      fetchAll();
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = '';
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Remove this document from the knowledge base?')) return;
    await kbApi.deleteDocument(docId);
    fetchAll();
  };

  const handleRebuild = async () => {
    setRebuilding(true);
    setRebuildResult(null);
    setError('');
    try {
      const res = await kbApi.rebuild();
      setRebuildResult(`Index rebuilt. ${res.data.chunks_indexed} chunks indexed.`);
      fetchAll();
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Rebuild failed.');
    } finally {
      setRebuilding(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <Layout>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Knowledge Base</h1>
            <p className="page-subtitle">Upload and manage your organisation's internal policy documents.</p>
          </div>
          <button
            id="rebuild-kb-btn"
            className="btn btn-outline"
            onClick={handleRebuild}
            disabled={rebuilding || docs.length === 0}
          >
            {rebuilding ? <><span className="loading-spinner loading-spinner-dark" /> Rebuilding…</> : '↻ Rebuild Index'}
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Status bar */}
        {status && (
          <div className="flex gap-6 mb-6">
            <div className="stat-card">
              <div className="stat-label">Documents</div>
              <div className="stat-value">{status.document_count}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Last Indexed</div>
              <div className="stat-value" style={{ fontSize: '1rem', marginTop: '8px', fontFamily: 'var(--font-body)', fontWeight: 500 }}>
                {status.last_rebuild_at ? formatDate(status.last_rebuild_at) : 'Not yet built'}
              </div>
            </div>
          </div>
        )}

        {/* Upload zone */}
        <div className="card mb-6">
          <div className="card-header">
            <span className="card-title">Upload Document</span>
            <span className="text-xs text-muted">Supported formats: .docx, .pdf, .txt</span>
          </div>
          <div className="card-body">
            <div
              className="upload-zone"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
            >
              <input ref={fileRef} type="file" accept=".docx,.pdf,.txt" hidden onChange={handleFileChange} />
              {uploading ? (
                <><span className="loading-spinner loading-spinner-dark" style={{ marginBottom: '8px' }} /><div className="upload-zone-title">Uploading…</div></>
              ) : (
                <>
                  <div style={{ fontSize: '1.5rem', opacity: 0.4, marginBottom: '8px' }}>⊕</div>
                  <div className="upload-zone-title">Drop a file here, or click to select</div>
                  <div className="upload-zone-sub">Policy documents, compliance handbooks, security requirements</div>
                </>
              )}
            </div>
            {error && <div className="error-text mt-4">{error}</div>}
            {rebuildResult && <div className="alert alert-success mt-4">{rebuildResult}</div>}
          </div>
        </div>

        {/* Document list */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Uploaded Documents</span>
          </div>
          {loading ? (
            <div className="empty-state"><span className="loading-spinner loading-spinner-dark" /></div>
          ) : docs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">⊞</div>
              <div className="empty-state-title">No documents uploaded</div>
              <div className="empty-state-body">Upload policy documents above to populate the knowledge base.</div>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Type</th>
                  <th>Uploaded</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {docs.map(doc => (
                  <tr key={doc.id}>
                    <td><span className="font-mono text-sm">{doc.file_name}</span></td>
                    <td><span className="badge badge-info">{doc.file_type.toUpperCase()}</span></td>
                    <td className="text-muted text-sm">{formatDate(doc.uploaded_at)}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-red)' }} onClick={() => handleDelete(doc.id)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}
