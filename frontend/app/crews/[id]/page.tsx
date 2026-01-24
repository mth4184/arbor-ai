"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiGet, apiPut } from "../../api";

export default function CrewDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [crew, setCrew] = useState<any | null>(null);
  const [memberIds, setMemberIds] = useState("");
  const [jobs, setJobs] = useState<any[]>([]);

  async function load() {
    const [crewItem, jobItems] = await Promise.all([
      apiGet(`/crews/${id}`),
      apiGet("/jobs", { crew_id: id }),
    ]);
    setCrew(crewItem);
    setJobs(jobItems || []);
    if (crewItem?.members) {
      setMemberIds(crewItem.members.map((m: any) => m.user_id).join(", "));
    }
  }

  useEffect(() => {
    if (id) load();
  }, [id]);

  async function save() {
    if (!crew) return;
    const ids = memberIds
      .split(",")
      .map((value) => Number(value.trim()))
      .filter(Boolean);
    const updated = await apiPut(`/crews/${id}`, {
      name: crew.name,
      type: crew.type,
      color: crew.color,
      notes: crew.notes,
      member_ids: ids,
    });
    setCrew(updated);
  }

  if (!crew) {
    return (
      <main className="page">
        <p className="card-subtitle">Loading crew...</p>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Crew</p>
          <h2 className="page-title">{crew.name}</h2>
          <p className="page-subtitle">Manage crew members and schedules.</p>
        </div>
        <button className="btn btn-primary" onClick={save}>
          Save Changes
        </button>
      </header>

      <div className="page-grid">
        <section className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Crew details</div>
              <p className="card-subtitle">Editable crew info and notes.</p>
            </div>
            <span className="badge">Team</span>
          </div>
          <div className="form-grid">
            <div className="field">
              <label className="label">Name</label>
              <input
                className="input"
                value={crew.name}
                onChange={(e) => setCrew({ ...crew, name: e.target.value })}
              />
            </div>
            <div className="field">
              <label className="label">Type</label>
              <select
                className="select"
                value={crew.type}
                onChange={(e) => setCrew({ ...crew, type: e.target.value })}
              >
                <option value="GTC">GTC</option>
                <option value="PHC">PHC</option>
              </select>
            </div>
            <div className="field">
              <label className="label">Color</label>
              <input
                className="input"
                value={crew.color ?? ""}
                onChange={(e) => setCrew({ ...crew, color: e.target.value })}
              />
            </div>
            <div className="field field-full">
              <label className="label">Notes</label>
              <textarea
                className="textarea"
                value={crew.notes}
                onChange={(e) => setCrew({ ...crew, notes: e.target.value })}
              />
            </div>
            <div className="field field-full">
              <label className="label">Member IDs</label>
              <input
                className="input"
                value={memberIds}
                onChange={(e) => setMemberIds(e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Crew schedule</div>
              <p className="card-subtitle">Jobs assigned to this crew.</p>
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
