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
    <main>
      <h2>Schedule</h2>

      <label>
        Estimate:
        <select value={estimateId ?? ""} onChange={e=>setEstimateId(Number(e.target.value))}>
          {estimates.map(e => <option key={e.id} value={e.id}>Estimate #{e.id}</option>)}
        </select>
      </label>

      <div style={{ marginTop: 12, display: "grid", gap: 8, maxWidth: 520 }}>
        <button onClick={suggest}>AI Suggest Schedule</button>
        {ai && <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(ai, null, 2)}</pre>}

        <input placeholder="YYYY-MM-DD" value={date} onChange={e=>setDate(e.target.value)} />
        <input placeholder="Crew" value={crew} onChange={e=>setCrew(e.target.value)} />
        <button onClick={createJob}>Create Job</button>
      </div>

      <h3 style={{ marginTop: 24 }}>Jobs</h3>
      <ul>
        {jobs.map(j => (
          <li key={j.id}>Job #{j.id} — {j.scheduled_for} — {j.crew} — {j.status}</li>
        ))}
      </ul>
    </main>
  );
}
