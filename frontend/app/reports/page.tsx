"use client";

import { useEffect, useState } from "react";
import { apiGet } from "../api";
import StatusChip from "../components/StatusChip";

function dateOffset(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function ReportsPage() {
  const [start, setStart] = useState(dateOffset(-30));
  const [end, setEnd] = useState(dateOffset(0));
  const [revenue, setRevenue] = useState<any | null>(null);
  const [conversion, setConversion] = useState<any | null>(null);
  const [outstanding, setOutstanding] = useState<any[]>([]);

  async function load() {
    const [rev, conv, outstandingInvoices] = await Promise.all([
      apiGet("/reports/revenue", { start, end }),
      apiGet("/reports/estimate-conversion", { start, end }),
      apiGet("/reports/outstanding-invoices"),
    ]);
    setRevenue(rev);
    setConversion(conv);
    setOutstanding(outstandingInvoices || []);
  }

  useEffect(() => {
    load();
  }, [start, end]);

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Reports</p>
          <h2 className="page-title">Performance reporting</h2>
          <p className="page-subtitle">Revenue, outstanding balances, and conversion trends.</p>
        </div>
        <div className="filters">
          <input className="input" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          <input className="input" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          <button className="btn btn-primary" onClick={load}>
            Refresh
          </button>
        </div>
      </header>

      <section className="card-grid">
        <div className="stat-card">
          <div className="eyebrow">Revenue</div>
          <div className="stat-value">${revenue?.total_revenue?.toFixed?.(0) ?? 0}</div>
          <p className="card-subtitle">Payments in range</p>
        </div>
        <div className="stat-card">
          <div className="eyebrow">Conversion</div>
          <div className="stat-value">{((conversion?.conversion_rate ?? 0) * 100).toFixed(0)}%</div>
          <p className="card-subtitle">Estimate approval rate</p>
        </div>
        <div className="stat-card">
          <div className="eyebrow">Estimates</div>
          <div className="stat-value">{conversion?.total_estimates ?? 0}</div>
          <p className="card-subtitle">Created in range</p>
        </div>
        <div className="stat-card">
          <div className="eyebrow">Approved</div>
          <div className="stat-value">{conversion?.approved_estimates ?? 0}</div>
          <p className="card-subtitle">Approved in range</p>
        </div>
      </section>

      <section className="card section">
        <div className="card-header">
          <div>
            <div className="card-title">Outstanding invoices</div>
            <p className="card-subtitle">Invoices requiring follow-up.</p>
          </div>
          <span className="badge">{outstanding.length} outstanding</span>
        </div>
        {outstanding.length === 0 ? (
          <p className="card-subtitle">No outstanding invoices.</p>
        ) : (
          <table className="table section">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {outstanding.map((invoice) => (
                <tr key={invoice.invoice_id}>
                  <td>Invoice #{invoice.invoice_id}</td>
                  <td>Customer #{invoice.customer_id}</td>
                  <td>${invoice.balance}</td>
                  <td>
                    <StatusChip status={invoice.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
