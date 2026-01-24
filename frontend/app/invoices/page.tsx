"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, apiPost } from "../api";
import StatusChip from "../components/StatusChip";
import NumberInput from "../components/NumberInput";

export default function InvoicesPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [jobId, setJobId] = useState<string>("");
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  async function refresh() {
    const js = await apiGet("/jobs");
    setJobs(js);
    if (!jobId && js.length) setJobId(String(js[0].id));
    setInvoices(await apiGet("/invoices", { status: statusFilter || undefined, q: search }));
  }
  useEffect(() => { refresh(); }, [statusFilter, search]);
  useEffect(() => {
    const job = jobs.find((item) => String(item.id) === jobId);
    if (job) setSubtotal(job.total);
  }, [jobId, jobs]);

  async function createInvoice() {
    if (!jobId) return;
    const job = jobs.find((j) => j.id === Number(jobId));
    if (!job) return;
    await apiPost("/invoices", {
      customer_id: job.customer_id,
      job_id: Number(jobId),
      subtotal,
      tax,
      total: subtotal + tax,
      status: "unpaid",
    });
    setSubtotal(0);
    setTax(0);
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
              value={jobId}
              onChange={e=>setJobId(e.target.value)}
            >
              {jobs.map(j => (
                <option key={j.id} value={j.id}>Job #{j.id}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="invoice-subtotal">Subtotal</label>
            <NumberInput
              id="invoice-subtotal"
              className="input"
              value={subtotal}
              onValueChange={setSubtotal}
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="invoice-tax">Tax</label>
            <NumberInput
              id="invoice-tax"
              className="input"
              value={tax}
              onValueChange={setTax}
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
        <div className="filters section">
          <input
            className="input"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
          </select>
        </div>
        {invoices.length === 0 ? (
          <p className="card-subtitle">No invoices yet. Create one above.</p>
        ) : (
          <table className="table section">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Job</th>
                <th>Total</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(i => (
                <tr key={i.id}>
                  <td>Invoice #{i.id}</td>
                  <td>Job #{i.job_id}</td>
                  <td>${i.total}</td>
                  <td>
                    <StatusChip status={i.status} />
                  </td>
                  <td>
                    <Link className="btn btn-secondary" href={`/invoices/${i.id}`}>
                      View
                    </Link>
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
