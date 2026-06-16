import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function RegisterPage() {
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [handle, setHandle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register(handle, displayName, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Registration failed.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">ContractIQ</div>
        <div>
          <div className="auth-tagline">A shared environment for contract negotiation.</div>
          <p className="auth-tagline-sub">
            Register your organisation to upload policy documents, initiate negotiations, and evaluate contractual revisions against internal compliance policies.
          </p>
        </div>
        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.05em' }}>
          DEMONSTRATION PRODUCT · NOT FOR PRODUCTION USE
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-container">
          <h1 className="auth-form-title">Register Company</h1>
          <p className="auth-form-subtitle">Create a new company account to access the platform.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="form-group">
              <label className="form-label">Company Handle</label>
              <input
                id="register-handle"
                className="form-input"
                type="text"
                placeholder="e.g. aureum (used for login and search)"
                value={handle}
                onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/\s/g, ''))}
                required
              />
              <span className="form-hint">Lowercase, no spaces. Used by counterparties to find you.</span>
            </div>

            <div className="form-group">
              <label className="form-label">Display Name</label>
              <input
                id="register-displayname"
                className="form-input"
                type="text"
                placeholder="e.g. Aureum Systems Ltd."
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                id="register-password"
                className="form-input"
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {error && <div className="error-text">{error}</div>}

            <button id="register-submit" className="btn btn-primary btn-lg" type="submit" disabled={isLoading} style={{ marginTop: '8px' }}>
              {isLoading ? <span className="loading-spinner" /> : 'Create Account'}
            </button>
          </form>

          <p style={{ marginTop: '24px', fontSize: '0.875rem', color: 'var(--color-ink-3)' }}>
            Already registered?{' '}
            <a href="/login" style={{ color: 'var(--color-accent)', fontWeight: 500 }}>Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
}
