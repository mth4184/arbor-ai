"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, apiPost } from "../api";
import StatusChip from "../components/StatusChip";

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [estimates, setEstimates] = useState<any[]>([]);
  const [crews, setCrews] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState<string>("");
  const [estimateId, setEstimateId] = useState<string>("");
  const [crewId, setCrewId] = useState<string>("");
  const [status, setStatus] = useState("scheduled");
  const [scheduledStart, setScheduledStart] = useState("");
  const [scheduledEnd, setScheduledEnd] = useState("");
  const [total, setTotal] = useState(0);
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  async function refresh() {
    const [jobItems, customerItems, estimateItems, crewItems] = await Promise.all([
      apiGet("/jobs", { q: search, status: statusFilter || undefined }),
      apiGet("/customers"),
      apiGet("/estimates"),
      apiGet("/crews"),
    ]);
    setJobs(jobItems);
    setCustomers(customerItems);
    setEstimates(estimateItems);
    setCrews(crewItems);
    if (!customerId && customerItems.length) setCustomerId(String(customerItems[0].id));
  }

  useEffect(() => {
    refresh();
  }, [search, statusFilter]);

  async function createJob() {
    if (!customerId) return;
    await apiPost("/jobs", {
      customer_id: Number(customerId),
      estimate_id: estimateId ? Number(estimateId) : null,
      status,
      scheduled_start: scheduledStart || null,
      scheduled_end: scheduledEnd || null,
      crew_id: crewId ? Number(crewId) : null,
      total,
      notes,
      tasks: [],
      equipment_ids: [],
    });
    setEstimateId("");
    setCrewId("");
    setScheduledStart("");
    setScheduledEnd("");
    setTotal(0);
    setNotes("");
    await refresh();
  }

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Jobs</p>
          <h2 className="page-title">Work orders</h2>
          <p className="page-subtitle">
            Assign crews, manage tasks, and track job completion.
          </p>
        </div>
        <button className="btn btn-primary" onClick={createJob}>
          New Job
        </button>
      </header>

      <section className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Create job</div>
            <p className="card-subtitle">Schedule approved work.</p>
          </div>
          <span className="badge">Scheduling</span>
        </div>
        <div className="form-grid">
          <div className="field">
            <label className="label">Customer</label>
            <select className="select" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label">Estimate</label>
            <select className="select" value={estimateId} onChange={(e) => setEstimateId(e.target.value)}>
              <option value="">None</option>
              {estimates.map((e) => (
                <option key={e.id} value={e.id}>
                  Estimate #{e.id}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label">Crew</label>
            <select className="select" value={crewId} onChange={(e) => setCrewId(e.target.value)}>
              <option value="">Unassigned</option>
              {crews.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label">Status</label>
            <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
              <option value="canceled">Canceled</option>
            </select>
          </div>
          <div className="field">
            <label className="label">Scheduled start</label>
            <input
              className="input"
              placeholder="2026-01-24T08:00:00"
              value={scheduledStart}
              onChange={(e) => setScheduledStart(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="label">Scheduled end</label>
            <input
              className="input"
              placeholder="2026-01-24T16:00:00"
              value={scheduledEnd}
              onChange={(e) => setScheduledEnd(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="label">Total</label>
            <input
              className="input"
              type="number"
              value={total}
              onChange={(e) => setTotal(Number(e.target.value))}
            />
          </div>
          <div className="field field-full">
            <label className="label">Notes</label>
            <textarea
              className="textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="card section">
        <div className="card-header">
          <div>
            <div className="card-title">Jobs list</div>
            <p className="card-subtitle">Search and filter upcoming work orders.</p>
          </div>
          <span className="badge">{jobs.length} total</span>
        </div>
        <div className="filters section">
          <input
            className="input"
            placeholder="Search by customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>
        {jobs.length === 0 ? (
          <p className="card-subtitle">No jobs scheduled yet.</p>
        ) : (
          <table className="table section">
            <thead>
              <tr>
                <th>Job</th>
                <th>Customer</th>
                <th>Crew</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td>Job #{job.id}</td>
                  <td>Customer #{job.customer_id}</td>
                  <td>{job.crew_id ? `Crew #${job.crew_id}` : "Unassigned"}</td>
                  <td>
                    <StatusChip status={job.status} />
                  </td>
                  <td>
                    <Link className="btn btn-secondary" href={`/jobs/${job.id}`}>
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
