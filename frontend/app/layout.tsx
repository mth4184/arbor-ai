import "./globals.css";
import Sidebar from "./components/Sidebar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <Sidebar />
          <div className="main">
            <header className="topbar">
              <div>
                <div className="eyebrow">ArborGold Ops</div>
                <div className="topbar-title">Operations Hub</div>
              </div>
              <div className="header-actions">
                <span className="header-pill">Dispatch ready</span>
                <span className="header-pill">Winter prep</span>
              </div>
            </header>
            <div className="content">{children}</div>
            <footer className="site-footer">
              ArborGold keeps estimates, crews, and invoicing in one place.
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
