import { useEffect, useState, useCallback } from 'react';
import { marked } from 'marked';

interface DocPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fetchContent: () => Promise<string>;
}

export function DocPreviewModal({ isOpen, onClose, title, fetchContent }: DocPreviewModalProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const loadContent = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchContent();
      setContent(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch document content.');
    } finally {
      setLoading(false);
    }
  }, [fetchContent]);

  useEffect(() => {
    if (isOpen) {
      loadContent();
    }
  }, [isOpen, loadContent]);

  if (!isOpen) return null;

  // Compile markdown to html synchronously
  let htmlContent = '';
  try {
    htmlContent = marked.parse(content) as string;
  } catch (err) {
    console.error('Failed to parse markdown:', err);
    htmlContent = `<pre>${content}</pre>`;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="btn btn-ghost" onClick={onClose} style={{ fontSize: '1.5rem', padding: '0 8px' }}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          {loading ? (
            <div className="empty-state">
              <span className="loading-spinner loading-spinner-dark" style={{ marginBottom: '8px' }} />
              <div>Loading document content…</div>
            </div>
          ) : error ? (
            <div className="alert alert-error" style={{ textAlign: 'center' }}>
              {error}
            </div>
          ) : (
            <div className="parchment-preview-body">
              <div 
                className="markdown-body"
                dangerouslySetInnerHTML={{ __html: htmlContent }} 
              />
            </div>
          )}
        </div>
        <div className="modal-footer justify-end">
          <button className="btn btn-outline" onClick={onClose}>
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
