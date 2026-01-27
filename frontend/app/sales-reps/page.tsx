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
  const [jobs, setJobs] = useState<any[]>([]);
  const [form, setForm] = useState(emptyForm);

  async function refresh() {
    const [repItems, jobItems] = await Promise.all([apiGet("/sales-reps"), apiGet("/jobs")]);
    setSalesReps(repItems || []);
    setJobs(jobItems || []);
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

  function formatCurrency(value: number) {
    return value.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  }

  const salesAnalytics = (() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const monthStart = new Date(now);
    monthStart.setDate(now.getDate() - 30);
    const quarterStart = new Date(now);
    quarterStart.setDate(now.getDate() - 90);
    const yearStart = new Date(now);
    yearStart.setDate(now.getDate() - 365);

    return salesReps.map((rep) => {
      const repJobs = jobs.filter(
        (job) => job.sales_rep_id === rep.id && job.status !== "canceled",
      );
      let totalRevenue = 0;
      let weekRevenue = 0;
      let monthRevenue = 0;
      let quarterRevenue = 0;
      let yearRevenue = 0;

      repJobs.forEach((job) => {
        const dateValue = job.scheduled_start || job.created_at;
        if (!dateValue) return;
        const jobDate = new Date(dateValue);
        const amount = Number(job.total) || 0;
        totalRevenue += amount;
        if (jobDate >= weekStart) weekRevenue += amount;
        if (jobDate >= monthStart) monthRevenue += amount;
        if (jobDate >= quarterStart) quarterRevenue += amount;
        if (jobDate >= yearStart) yearRevenue += amount;
      });

      return {
        id: rep.id,
        name: rep.name,
        jobs: repJobs.length,
        avgJob: repJobs.length ? totalRevenue / repJobs.length : 0,
        weekRevenue,
        monthRevenue,
        quarterRevenue,
        yearRevenue,
      };
    });
  })();

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

      <section className="card section">
        <div className="card-header">
          <div>
            <div className="card-title">Sales performance analytics</div>
            <p className="card-subtitle">
              Revenue totals by rep (weekly, monthly, quarterly, annual) and average per job.
            </p>
          </div>
          <span className="badge">{salesReps.length} reps</span>
        </div>
        {salesReps.length === 0 ? (
          <p className="card-subtitle">Add a sales rep to see analytics.</p>
        ) : (
          <table className="table section">
            <thead>
              <tr>
                <th>Sales rep</th>
                <th>Jobs</th>
                <th>Avg per job</th>
                <th>Week</th>
                <th>Month</th>
                <th>Quarter</th>
                <th>Annual</th>
              </tr>
            </thead>
            <tbody>
              {salesAnalytics.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.jobs}</td>
                  <td>{formatCurrency(row.avgJob)}</td>
                  <td>{formatCurrency(row.weekRevenue)}</td>
                  <td>{formatCurrency(row.monthRevenue)}</td>
                  <td>{formatCurrency(row.quarterRevenue)}</td>
                  <td>{formatCurrency(row.yearRevenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="card-subtitle">
          Uses scheduled start when available, otherwise job creation date. Canceled jobs are excluded.
        </p>
      </section>
    </main>
  );
}
