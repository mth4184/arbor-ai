"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, apiPost } from "../api";
import StatusChip from "../components/StatusChip";
import NumberInput from "../components/NumberInput";

export default function InvoicesPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState<string>("");
  const [jobId, setJobId] = useState<string>("");
  const [subtotal, setSubtotal] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [sentDate, setSentDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  async function refresh() {
    const [customerItems, jobItems, invoiceItems] = await Promise.all([
      apiGet("/customers"),
      apiGet("/jobs"),
      apiGet("/invoices", { status: statusFilter || undefined, q: search }),
    ]);
    setCustomers(customerItems);
    setJobs(jobItems);
    setInvoices(invoiceItems);
    if (!customerId && customerItems.length) setCustomerId(String(customerItems[0].id));
  }
  useEffect(() => { refresh(); }, [statusFilter, search]);
  useEffect(() => {
    if (!sentDate) {
      const today = new Date().toISOString().slice(0, 10);
      setSentDate(today);
    }
  }, [sentDate]);
  useEffect(() => {
    const filteredJobs = jobs.filter((job) => String(job.customer_id) === customerId);
    if (!jobId && filteredJobs.length) {
      setJobId(String(filteredJobs[0].id));
    }
    if (jobId && !filteredJobs.some((job) => String(job.id) === jobId)) {
      setJobId("");
    }
    const job = jobs.find((item) => String(item.id) === jobId);
    if (job) setSubtotal(job.total);
  }, [customerId, jobId, jobs]);

  async function createInvoice() {
    if (!jobId || !customerId) return;
    const job = jobs.find((j) => j.id === Number(jobId));
    if (!job) return;
    const taxAmount = Number(((subtotal * taxRate) / 100).toFixed(2));
    await apiPost("/invoices", {
      customer_id: Number(customerId),
      job_id: Number(jobId),
      subtotal,
      tax: taxAmount,
      total: subtotal + taxAmount,
      status: "unpaid",
      sent_at: sentDate ? `${sentDate}T00:00:00` : null,
      due_date: dueDate ? `${dueDate}T00:00:00` : null,
    });
    setSubtotal(0);
    setTaxRate(0);
    setDueDate("");
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
            <label className="label" htmlFor="invoice-customer">Customer</label>
            <select
              id="invoice-customer"
              className="select"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="invoice-job">Job</label>
            <select
              id="invoice-job"
              className="select"
              value={jobId}
              onChange={e=>setJobId(e.target.value)}
            >
              {jobs
                .filter((job) => String(job.customer_id) === customerId)
                .map((j) => (
                  <option key={j.id} value={j.id}>
                    Job #{j.id}
                  </option>
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
              prefix="$"
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="invoice-tax">Tax rate</label>
            <NumberInput
              id="invoice-tax"
              className="input"
              value={taxRate}
              onValueChange={setTaxRate}
              suffix="%"
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="invoice-sent">Date sent</label>
            <input
              id="invoice-sent"
              className="input"
              type="date"
              value={sentDate}
              onChange={(e) => setSentDate(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="invoice-due">Due date</label>
            <input
              id="invoice-due"
              className="input"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
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
                  <td>{customers.find((c) => c.id === i.customer_id)?.name || "Customer"} Invoice #{i.id}</td>
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
