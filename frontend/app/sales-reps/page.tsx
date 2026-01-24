"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, apiPost } from "../api";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  notes: "",
};

export default function SalesRepsPage() {
  const [salesReps, setSalesReps] = useState<any[]>([]);
  const [form, setForm] = useState(emptyForm);

  async function refresh() {
    setSalesReps(await apiGet("/sales-reps"));
  }

  useEffect(() => {
    refresh();
  }, []);

  async function createSalesRep() {
    if (!form.name.trim()) return;
    await apiPost("/sales-reps", {
      name: form.name,
      email: form.email,
      phone: form.phone,
      notes: form.notes,
    });
    setForm(emptyForm);
    await refresh();
  }

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Sales reps</p>
          <h2 className="page-title">Sales rep management</h2>
          <p className="page-subtitle">Track the team closing new work.</p>
        </div>
        <button className="btn btn-primary" onClick={createSalesRep}>
          New Sales Rep
        </button>
      </header>

      <section className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Create sales rep</div>
            <p className="card-subtitle">Add a new sales contact.</p>
          </div>
          <span className="badge">Sales</span>
        </div>
        <div className="form-grid">
          <div className="field">
            <label className="label">Name</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="field">
            <label className="label">Email</label>
            <input
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="field">
            <label className="label">Phone</label>
            <input
              className="input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="field field-full">
            <label className="label">Notes</label>
            <textarea
              className="textarea"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>
      </section>

      <section className="card section">
        <div className="card-header">
          <div>
            <div className="card-title">Sales reps</div>
            <p className="card-subtitle">Open profiles and review assignments.</p>
          </div>
          <span className="badge">{salesReps.length} total</span>
        </div>
        {salesReps.length === 0 ? (
          <p className="card-subtitle">No sales reps yet.</p>
        ) : (
          <table className="table section">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {salesReps.map((rep) => (
                <tr key={rep.id}>
                  <td>{rep.name}</td>
                  <td>
                    {rep.email}
                    <div className="list-meta">{rep.phone}</div>
                  </td>
                  <td>
                    <Link className="btn btn-secondary" href={`/sales-reps/${rep.id}`}>
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
