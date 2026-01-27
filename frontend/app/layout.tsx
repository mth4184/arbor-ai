import "./globals.css";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
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
                <div className="eyebrow">ArborSoftAI Ops</div>
                <div className="topbar-title">Operations Hub</div>
              </div>
              <div className="header-actions">
                <Link className="header-pill header-pill-link" href="/internal-communications">
                  Internal communications
                </Link>
                <Link className="header-pill header-pill-link" href="/phc">
                  PHC
                </Link>
                <Link className="header-pill header-pill-link" href="/gtc">
                  GTC
                </Link>
                <Link className="header-pill header-pill-link" href="/sales-reps-communications">
                  Sales Reps
                </Link>
              </div>
            </header>
            <div className="content">{children}</div>
            <footer className="site-footer">
              ArborSoftAI keeps estimates, crews, and invoicing in one place.
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
