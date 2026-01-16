import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <header className="site-header">
            <div className="header-inner">
              <div className="site-brand">
                <div className="brand-mark" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 3C8.2 4.3 5.2 8 5.2 12.1c0 4.3 3 8.2 6.8 8.9 3.8-.7 6.8-4.6 6.8-8.9C18.8 8 15.8 4.3 12 3Z"
                      fill="currentColor"
                      opacity="0.9"
                    />
                    <path
                      d="M12 5.6v12.8"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    <path
                      d="M12 12.2c-2.6 0-4.7-1.5-5.7-3.2"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div>
                  <div className="brand-title">Arbor AI</div>
                  <div className="brand-subtitle">Professional arborist operations</div>
                </div>
              </div>
              <div className="header-actions">
                <span className="header-pill">Crew ready</span>
                <span className="header-pill">Storm response</span>
              </div>
            </div>
            <nav className="site-nav">
              <a href="/" className="nav-link">Dashboard</a>
              <a href="/leads" className="nav-link">Leads</a>
              <a href="/estimates" className="nav-link">Estimates</a>
              <a href="/schedule" className="nav-link">Schedule</a>
              <a href="/invoices" className="nav-link">Invoices</a>
            </nav>
          </header>
          <div className="content">{children}</div>
          <footer className="site-footer">
            Arbor AI helps arborists move from first call to final invoice.
          </footer>
        </div>
      </body>
    </html>
  );
}
