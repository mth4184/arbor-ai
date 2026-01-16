"use client";
import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../api";

export default function SchedulePage() {
  const [estimates, setEstimates] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [estimateId, setEstimateId] = useState<number | null>(null);

  const [crew, setCrew] = useState("A-team");
  const [date, setDate] = useState("");
  const [ai, setAi] = useState<any>(null);

  async function refresh() {
    const es = await apiGet("/estimates");
    setEstimates(es);
    if (es.length && estimateId === null) setEstimateId(es[0].id);
    setJobs(await apiGet("/jobs"));
  }
  useEffect(() => { refresh(); }, []);

  async function suggest() {
    if (!estimateId) return;
    setAi(await apiPost("/ai/schedule", {
      estimate_id: estimateId,
      preferred_window: "next 10 days",
      crew_options: ["A-team", "B-team"],
    }));
  }

  async function createJob() {
    if (!estimateId) return;
    await apiPost("/jobs", {
      estimate_id: estimateId,
      scheduled_for: date || ai?.suggested_date || "",
      crew: crew || ai?.suggested_crew || "",
      address: "",
    });
    setAi(null);
    setDate("");
    await refresh();
  }

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Scheduling</p>
          <h2 className="page-title">Schedule</h2>
          <p className="page-subtitle">
            Balance crews with the latest estimate approvals and property needs.
          </p>
        </div>
        <span className="badge">Crew planner</span>
      </header>

      <section className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Plan the job</div>
            <p className="card-subtitle">
              Pick an estimate and assign a date and crew for the work order.
            </p>
          </div>
          <span className="badge">AI available</span>
        </div>
        <div className="form-grid">
          <div className="field">
            <label className="label" htmlFor="schedule-estimate">Estimate</label>
            <select
              id="schedule-estimate"
              className="select"
              value={estimateId ?? ""}
              onChange={e=>setEstimateId(Number(e.target.value))}
            >
              {estimates.map(e => (
                <option key={e.id} value={e.id}>Estimate #{e.id}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="schedule-date">Scheduled date</label>
            <input
              id="schedule-date"
              className="input"
              placeholder="YYYY-MM-DD"
              value={date}
              onChange={e=>setDate(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="schedule-crew">Crew</label>
            <input
              id="schedule-crew"
              className="input"
              placeholder="Crew"
              value={crew}
              onChange={e=>setCrew(e.target.value)}
            />
          </div>
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={suggest}>
              AI Suggest Schedule
            </button>
            <button className="btn btn-primary" onClick={createJob}>
              Create Job
            </button>
          </div>
        </div>
        {ai && (
          <div className="panel section">
            <div className="card-title">AI recommendation</div>
            <p className="card-subtitle">
              Suggested crew and timing based on current workload.
            </p>
            <pre className="code-block section">{JSON.stringify(ai, null, 2)}</pre>
          </div>
        )}
      </section>

      <section className="card section">
        <div className="card-header">
          <div>
            <div className="card-title">Upcoming jobs</div>
            <p className="card-subtitle">
              Confirm crew assignments and job status for the week.
            </p>
          </div>
          <span className="badge">{jobs.length} scheduled</span>
        </div>
        {jobs.length === 0 ? (
          <p className="card-subtitle">No jobs yet. Schedule the first one above.</p>
        ) : (
          <ul className="list">
            {jobs.map(j => (
              <li key={j.id} className="list-item">
                <div>
                  <div className="list-title">Job #{j.id}</div>
                  <div className="list-meta">
                    {j.scheduled_for} · {j.crew}
                  </div>
                </div>
                <span className="list-status">{j.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
