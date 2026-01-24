"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiGet, apiPut } from "../../api";

export default function SalesRepDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [salesRep, setSalesRep] = useState<any | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);

  async function load() {
    const [rep, jobItems] = await Promise.all([
      apiGet(`/sales-reps/${id}`),
      apiGet("/jobs", { sales_rep_id: id }),
    ]);
    setSalesRep(rep);
    setJobs(jobItems || []);
  }

  useEffect(() => {
    if (id) load();
  }, [id]);

  async function save() {
    if (!salesRep) return;
    const updated = await apiPut(`/sales-reps/${id}`, salesRep);
    setSalesRep(updated);
  }

  if (!salesRep) {
    return (
      <main className="page">
        <p className="card-subtitle">Loading sales rep...</p>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Sales rep</p>
          <h2 className="page-title">{salesRep.name}</h2>
          <p className="page-subtitle">Manage contact details and assigned jobs.</p>
        </div>
        <button className="btn btn-primary" onClick={save}>
          Save Changes
        </button>
      </header>

      <div className="page-grid">
        <section className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Sales rep details</div>
              <p className="card-subtitle">Update contact information.</p>
            </div>
            <span className="badge">Sales</span>
          </div>
          <div className="form-grid">
            <div className="field">
              <label className="label">Name</label>
              <input
                className="input"
                value={salesRep.name}
                onChange={(e) => setSalesRep({ ...salesRep, name: e.target.value })}
              />
            </div>
            <div className="field">
              <label className="label">Email</label>
              <input
                className="input"
                value={salesRep.email}
                onChange={(e) => setSalesRep({ ...salesRep, email: e.target.value })}
              />
            </div>
            <div className="field">
              <label className="label">Phone</label>
              <input
                className="input"
                value={salesRep.phone}
                onChange={(e) => setSalesRep({ ...salesRep, phone: e.target.value })}
              />
            </div>
            <div className="field field-full">
              <label className="label">Notes</label>
              <textarea
                className="textarea"
                value={salesRep.notes}
                onChange={(e) => setSalesRep({ ...salesRep, notes: e.target.value })}
              />
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Assigned jobs</div>
              <p className="card-subtitle">Jobs closed by this rep.</p>
            </div>
            <span className="badge">{jobs.length} jobs</span>
          </div>
          <ul className="list">
            {jobs.map((job) => (
              <li key={job.id} className="list-item">
                <div>
                  <div className="list-title">Job #{job.id}</div>
                  <div className="list-meta">{job.status}</div>
                </div>
                <Link className="btn btn-secondary" href={`/jobs/${job.id}`}>
                  View
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
