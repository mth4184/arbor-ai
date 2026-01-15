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
    <main>
      <h2>Invoices</h2>

      <div style={{ display: "grid", gap: 8, maxWidth: 420 }}>
        <label>
          Job:
          <select value={jobId ?? ""} onChange={e=>setJobId(Number(e.target.value))}>
            {jobs.map(j => <option key={j.id} value={j.id}>Job #{j.id}</option>)}
          </select>
        </label>
        <input type="number" value={amount} onChange={e=>setAmount(Number(e.target.value))} />
        <button onClick={createInvoice}>Create Invoice</button>
      </div>

      <h3 style={{ marginTop: 24 }}>Recent</h3>
      <ul>
        {invoices.map(i => (
          <li key={i.id}>Invoice #{i.id} — job #{i.job_id} — ${i.amount} — {i.status}</li>
        ))}
      </ul>
    </main>
  );
}
