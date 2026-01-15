export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui", margin: 0 }}>
        <div style={{ padding: 16, borderBottom: "1px solid #eee" }}>
          <a href="/" style={{ marginRight: 12 }}>Home</a>
          <a href="/leads" style={{ marginRight: 12 }}>Leads</a>
          <a href="/estimates" style={{ marginRight: 12 }}>Estimates</a>
          <a href="/schedule" style={{ marginRight: 12 }}>Schedule</a>
          <a href="/invoices">Invoices</a>
        </div>
        <div style={{ padding: 16 }}>{children}</div>
      </body>
    </html>
  );
}
