import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const NAV = [
  { to: '/dashboard', label: 'Negotiations', icon: '⇌' },
  { to: '/settings/kb', label: 'Knowledge Base', icon: '⊞' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { company, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <nav className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-text">Contract Intelligence Platform</div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-label">Navigation</div>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              <span style={{ fontSize: '0.9rem', lineHeight: 1 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="sidebar-footer">
          {company && (
            <div style={{ marginBottom: '12px' }}>
              <div className="sidebar-company-name">{company.display_name}</div>
              <div className="sidebar-company-handle">@{company.company_handle}</div>
            </div>
          )}
          <button className="btn btn-ghost btn-sm" style={{ color: 'rgba(255,255,255,0.5)', width: '100%', justifyContent: 'flex-start', padding: '6px 0' }} onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </nav>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
