import React from 'react';

interface AuthLeftProps {
  tagline?: string;
  taglineSub?: string;
}

export function AuthLeft({
  tagline = "Structured contract negotiation and policy compliance.",
  taglineSub = "Track revisions, attribute changes, and evaluate contractual language against your organisation's internal policies. All in one auditable environment."
}: AuthLeftProps) {
  return (
    <div className="auth-left">
      <div className="auth-brand">Contract Intelligence Platform</div>
      <div>
        <div className="auth-tagline">{tagline}</div>
        <p className="auth-tagline-sub">{taglineSub}</p>
      </div>
      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.05em' }}>
        DEMONSTRATION PRODUCT · NOT FOR PRODUCTION USE
      </div>
    </div>
  );
}
