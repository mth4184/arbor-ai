"use client";
import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../api";

export default function InvoicesPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [jobId, setJobId] = useState<number | null>(null);
  const [amount, setAmount] = useState(0);

  async function refresh() {
    const js = await apiGet("/jobs");
    setJobs(js);
    if (js.length && jobId === null) setJobId(js[0].id);
    setInvoices(await apiGet("/invoices"));
  }
  useEffect(() => { refresh(); }, []);

  async function createInvoice() {
    if (!jobId) return;
    await apiPost("/invoices", { job_id: jobId, amount });
    setAmount(0);
    await refresh();
  }

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Billing</p>
          <h2 className="page-title">Invoices</h2>
          <p className="page-subtitle">
            Create invoices for completed work and track payment status.
          </p>
        </div>
        <span className="badge">Accounts</span>
      </header>

      <section className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Create invoice</div>
            <p className="card-subtitle">
              Connect a completed job with the final billing amount.
            </p>
          </div>
          <span className="badge">Payment ready</span>
        </div>
        <div className="form-grid">
          <div className="field">
            <label className="label" htmlFor="invoice-job">Job</label>
            <select
              id="invoice-job"
              className="select"
              value={jobId ?? ""}
              onChange={e=>setJobId(Number(e.target.value))}
            >
              {jobs.map(j => (
                <option key={j.id} value={j.id}>Job #{j.id}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="invoice-amount">Amount</label>
            <input
              id="invoice-amount"
              className="input"
              type="number"
              value={amount}
              onChange={e=>setAmount(Number(e.target.value))}
            />
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" onClick={createInvoice}>
              Create Invoice
            </button>
          </div>
        </div>
      </section>

      <section className="card section">
        <div className="card-header">
          <div>
            <div className="card-title">Recent invoices</div>
            <p className="card-subtitle">
              Monitor invoice status and outstanding balances.
            </p>
          </div>
          <span className="badge">{invoices.length} total</span>
        </div>
        {invoices.length === 0 ? (
          <p className="card-subtitle">No invoices yet. Create one above.</p>
        ) : (
          <ul className="list">
            {invoices.map(i => (
              <li key={i.id} className="list-item">
                <div>
                  <div className="list-title">Invoice #{i.id}</div>
                  <div className="list-meta">
                    Job #{i.job_id} · ${i.amount}
                  </div>
                </div>
                <span className="list-status">{i.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
