import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Footer } from '../components/Footer';
import { AuthLeft } from '../components/AuthLeft';

export function RegisterPage() {
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [handle, setHandle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Register Company - Contract Manager App';
  }, []);

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
      <AuthLeft
        tagline="A shared environment for contract negotiation."
        taglineSub="Register your organisation to upload policy documents, initiate negotiations, and evaluate contractual revisions against internal compliance policies."
      />

      <div className="auth-right" style={{ flexDirection: 'column', padding: 0, display: 'flex', height: '100vh', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <div className="auth-form-container" style={{ paddingLeft: '40px', paddingRight: '40px', width: '100%' }}>
            <h1 className="auth-form-title">Register Company</h1>
            <p className="auth-form-subtitle">Create a new company account to access the platform.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Company Handle</label>
                <input
                  id="register-handle"
                  className="form-input"
                  type="text"
                  placeholder="Enter a handle for your company"
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
                  placeholder="Your company's full name"
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

        <Footer style={{ width: '100%', background: 'transparent', borderLeft: 'none', borderRight: 'none', borderBottom: 'none', padding: '16px 40px' }} />
      </div>
    </div>
  );
}
