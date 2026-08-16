interface FooterProps {
  style?: React.CSSProperties;
}

export function Footer({ style }: FooterProps) {
  return (
    <footer style={{
      padding: '16px 40px',
      borderTop: '1px solid var(--color-border)',
      background: 'var(--color-surface)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: '0.8rem',
      color: 'var(--color-ink-3)',
      marginTop: 'auto',
      ...style
    }}>
      <div className="flex items-center gap-4">
        <span>Developed & maintained by <strong>Bhargav Rokade</strong></span>
        <a
          href="https://www.linkedin.com/in/bhargav-rokade-164a85241/"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline btn-sm"
          style={{ padding: '3px 8px', fontSize: '0.72rem' }}
        >
          LinkedIn
        </a>
        <a
          href="https://github.com/Bhargav-Rokade/Contract-LifeCycle-Management"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline btn-sm"
          style={{ padding: '3px 8px', fontSize: '0.72rem' }}
        >
          GitHub Repository
        </a>
      </div>
      <div>
        <a href="/privacy.html" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>
          Privacy Policy
        </a>
      </div>
    </footer>
  );
}
