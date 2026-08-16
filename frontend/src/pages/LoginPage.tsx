import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Footer } from '../components/Footer';
import { AuthLeft } from '../components/AuthLeft';

export function LoginPage() {
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'User Login - Contract Manager App';
  }, []);

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
      <AuthLeft />

      <div className="auth-right" style={{ flexDirection: 'column', padding: 0, display: 'flex', height: '100vh', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <div className="auth-form-container" style={{ paddingLeft: '40px', paddingRight: '40px', width: '100%' }}>
            <h1 className="auth-form-title">Sign In</h1>
            <p className="auth-form-subtitle">Enter your company credentials to continue.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Company Handle</label>
                <input
                  id="login-handle"
                  className="form-input"
                  type="text"
                  placeholder="Your handle"
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

        <Footer style={{ width: '100%', background: 'transparent', borderLeft: 'none', borderRight: 'none', borderBottom: 'none', padding: '16px 40px' }} />
      </div>
    </div>
  );
}
