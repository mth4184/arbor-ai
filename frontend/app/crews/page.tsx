"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, apiPost } from "../api";

const emptyForm = {
  name: "",
  type: "GTC",
  color: "",
  notes: "",
  member_ids: "",
};

export default function CrewsPage() {
  const [crews, setCrews] = useState<any[]>([]);
  const [form, setForm] = useState(emptyForm);

  async function refresh() {
    setCrews(await apiGet("/crews"));
  }

  useEffect(() => {
    refresh();
  }, []);

  async function createCrew() {
    if (!form.name.trim()) return;
    const memberIds = form.member_ids
      .split(",")
      .map((id) => Number(id.trim()))
      .filter(Boolean);
    await apiPost("/crews", {
      name: form.name,
      type: form.type,
      color: form.color || null,
      notes: form.notes,
      member_ids: memberIds,
    });
    setForm(emptyForm);
    await refresh();
  }

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Crews</p>
          <h2 className="page-title">Crew management</h2>
          <p className="page-subtitle">Assign employees to crews and track schedules.</p>
        </div>
        <button className="btn btn-primary" onClick={createCrew}>
          New Crew
        </button>
      </header>

      <section className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Create crew</div>
            <p className="card-subtitle">Set crew names and member IDs.</p>
          </div>
          <span className="badge">Team</span>
        </div>
        <div className="form-grid">
          <div className="field">
            <label className="label">Crew name</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="field">
            <label className="label">Type</label>
            <select
              className="select"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="GTC">GTC</option>
              <option value="PHC">PHC</option>
            </select>
          </div>
          <div className="field">
            <label className="label">Color</label>
            <input
              className="input"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
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
          <div className="field field-full">
            <label className="label">Member IDs</label>
            <input
              className="input"
              placeholder="1, 2, 3"
              value={form.member_ids}
              onChange={(e) => setForm({ ...form, member_ids: e.target.value })}
            />
          </div>
        </div>
      </section>

      <section className="card section">
        <div className="card-header">
          <div>
            <div className="card-title">Crews</div>
            <p className="card-subtitle">Tap to open crew details and schedules.</p>
          </div>
          <span className="badge">{crews.length} crews</span>
        </div>
        {crews.length === 0 ? (
          <p className="card-subtitle">No crews yet.</p>
        ) : (
          <table className="table section">
            <thead>
              <tr>
                <th>Crew</th>
                <th>Type</th>
                <th>Members</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {crews.map((crew) => (
                <tr key={crew.id}>
                  <td>{crew.name}</td>
                  <td>{crew.type}</td>
                  <td>{crew.members?.length ?? 0}</td>
                  <td>
                    <Link className="btn btn-secondary" href={`/crews/${crew.id}`}>
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
