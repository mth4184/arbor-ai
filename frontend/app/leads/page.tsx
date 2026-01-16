"use client";
import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../api";

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", phone: "", address: "", notes: "" });

  async function refresh() {
    setLeads(await apiGet("/leads"));
  }
  useEffect(() => { refresh(); }, []);

  async function submit() {
    await apiPost("/leads", form);
    setForm({ name: "", phone: "", address: "", notes: "" });
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
            <label className="label" htmlFor="lead-name">Full name</label>
            <input
              id="lead-name"
              className="input"
              placeholder="Name"
              value={form.name}
              onChange={e=>setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="lead-phone">Phone</label>
            <input
              id="lead-phone"
              className="input"
              placeholder="Phone"
              value={form.phone}
              onChange={e=>setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="lead-address">Address</label>
            <input
              id="lead-address"
              className="input"
              placeholder="Address"
              value={form.address}
              onChange={e=>setForm({ ...form, address: e.target.value })}
            />
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
        {leads.length === 0 ? (
          <p className="card-subtitle">No leads yet. Add one above to get started.</p>
        ) : (
          <ul className="list">
            {leads.map(l => (
              <li className="list-item" key={l.id}>
                <div>
                  <div className="list-title">{l.name}</div>
                  <div className="list-meta">{l.phone} · {l.address}</div>
                </div>
                <span className="list-status">New</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
