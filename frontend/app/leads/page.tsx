"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, apiPost } from "../api";
import StatusChip from "../components/StatusChip";

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [form, setForm] = useState({
    customer_id: "",
    source: "",
    status: "new",
    notes: "",
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  async function refresh() {
    const [leadItems, customerItems] = await Promise.all([
      apiGet("/leads", { q: search, status: statusFilter || undefined }),
      apiGet("/customers"),
    ]);
    setLeads(leadItems);
    setCustomers(customerItems);
    if (!form.customer_id && customerItems.length) {
      setForm({ ...form, customer_id: String(customerItems[0].id) });
    }
  }
  useEffect(() => { refresh(); }, [search, statusFilter]);

  async function submit() {
    await apiPost("/leads", {
      customer_id: Number(form.customer_id),
      source: form.source,
      status: form.status,
      notes: form.notes,
    });
    setForm({ customer_id: form.customer_id, source: "", status: "new", notes: "" });
    await refresh();
  }

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Pipeline</p>
          <h2 className="page-title">Leads</h2>
          <p className="page-subtitle">
            Capture new inquiries and set up each property visit with complete
            contact details.
          </p>
        </div>
        <span className="badge">Intake</span>
      </header>

      <section className="card">
        <div className="card-header">
          <div>
            <div className="card-title">New lead</div>
            <p className="card-subtitle">
              Log the request and attach any site notes from the caller.
            </p>
          </div>
          <span className="badge">Priority routing</span>
        </div>
        <div className="form-grid">
          <div className="field">
            <label className="label" htmlFor="lead-customer">Customer</label>
            <select
              id="lead-customer"
              className="select"
              value={form.customer_id}
              onChange={e=>setForm({ ...form, customer_id: e.target.value })}
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="lead-source">Source</label>
            <input
              id="lead-source"
              className="input"
              placeholder="Website, referral, storm"
              value={form.source}
              onChange={e=>setForm({ ...form, source: e.target.value })}
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="lead-status">Status</label>
            <select
              id="lead-status"
              className="select"
              value={form.status}
              onChange={e=>setForm({ ...form, status: e.target.value })}
            >
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="lost">Lost</option>
            </select>
          </div>
          <div className="field field-full">
            <label className="label" htmlFor="lead-notes">Notes</label>
            <textarea
              id="lead-notes"
              className="textarea"
              placeholder="Notes"
              value={form.notes}
              onChange={e=>setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" onClick={submit}>Create Lead</button>
          </div>
        </div>
      </section>

      <section className="card section">
        <div className="card-header">
          <div>
            <div className="card-title">Recent leads</div>
            <p className="card-subtitle">
              The latest customer inquiries ready for estimate work.
            </p>
          </div>
          <span className="badge">{leads.length} active</span>
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
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="lost">Lost</option>
          </select>
        </div>
        {leads.length === 0 ? (
          <p className="card-subtitle">No leads yet. Add one above to get started.</p>
        ) : (
          <ul className="list">
            {leads.map(l => (
              <li className="list-item" key={l.id}>
                <div>
                  <div className="list-title">Lead #{l.id}</div>
                  <div className="list-meta">Customer #{l.customer_id} · {l.source || "Inbound"}</div>
                </div>
                <div className="table-actions">
                  <StatusChip status={l.status} />
                  <Link className="btn btn-secondary" href={`/leads/${l.id}`}>
                    View
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
