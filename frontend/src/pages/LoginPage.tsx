import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';

export function LoginPage() {
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(handle, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Login failed. Check your credentials.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">Contract Intelligence Platform</div>
        <div>
          <div className="auth-tagline">Structured contract negotiation and policy compliance.</div>
          <p className="auth-tagline-sub">
            Track revisions, attribute changes, and evaluate contractual language against your organisation's internal policies — all in one auditable environment.
          </p>
        </div>
        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.05em' }}>
          DEMONSTRATION PRODUCT · NOT FOR PRODUCTION USE
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-container">
          <h1 className="auth-form-title">Sign In</h1>
          <p className="auth-form-subtitle">Enter your company credentials to continue.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="form-group">
              <label className="form-label">Company Handle</label>
              <input
                id="login-handle"
                className="form-input"
                type="text"
                placeholder="e.g. aureum"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                id="login-password"
                className="form-input"
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && <div className="error-text">{error}</div>}

            <button id="login-submit" className="btn btn-primary btn-lg" type="submit" disabled={isLoading} style={{ marginTop: '8px' }}>
              {isLoading ? <span className="loading-spinner" /> : 'Sign In'}
            </button>
          </form>

          <p style={{ marginTop: '24px', fontSize: '0.875rem', color: 'var(--color-ink-3)' }}>
            No account?{' '}
            <a href="/register" style={{ color: 'var(--color-accent)', fontWeight: 500 }}>Register your company</a>
          </p>
        </div>
      </div>
    </div>
  );
}
