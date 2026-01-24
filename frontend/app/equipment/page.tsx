"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, apiPost } from "../api";
import StatusChip from "../components/StatusChip";

const emptyForm = {
  name: "",
  type: "",
  status: "available",
  notes: "",
};

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  async function refresh() {
    setEquipment(await apiGet("/equipment", { q: search, status: statusFilter || undefined }));
  }

  useEffect(() => {
    refresh();
  }, [search, statusFilter]);

  async function createEquipment() {
    if (!form.name.trim()) return;
    await apiPost("/equipment", {
      name: form.name,
      type: form.type,
      status: form.status,
      notes: form.notes,
    });
    setForm(emptyForm);
    await refresh();
  }

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Equipment</p>
          <h2 className="page-title">Assets & equipment</h2>
          <p className="page-subtitle">Track the status of critical gear.</p>
        </div>
        <button className="btn btn-primary" onClick={createEquipment}>
          New Equipment
        </button>
      </header>

      <section className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Add equipment</div>
            <p className="card-subtitle">Log new assets into inventory.</p>
          </div>
          <span className="badge">Inventory</span>
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
            <label className="label">Type</label>
            <input
              className="input"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            />
          </div>
          <div className="field">
            <label className="label">Status</label>
            <select
              className="select"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="available">Available</option>
              <option value="in_use">In use</option>
              <option value="maintenance">Maintenance</option>
            </select>
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
            <div className="card-title">Equipment list</div>
            <p className="card-subtitle">Filter assets by status.</p>
          </div>
          <span className="badge">{equipment.length} assets</span>
        </div>
        <div className="filters section">
          <input
            className="input"
            placeholder="Search equipment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="available">Available</option>
            <option value="in_use">In use</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
        {equipment.length === 0 ? (
          <p className="card-subtitle">No equipment added yet.</p>
        ) : (
          <table className="table section">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Type</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {equipment.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.type}</td>
                  <td>
                    <StatusChip status={item.status} />
                  </td>
                  <td>
                    <Link className="btn btn-secondary" href={`/equipment/${item.id}`}>
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
