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
    <main>
      <h2>Leads</h2>
      <div style={{ display: "grid", gap: 8, maxWidth: 600 }}>
        <input placeholder="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>
        <input placeholder="Phone" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})}/>
        <input placeholder="Address" value={form.address} onChange={e=>setForm({...form, address:e.target.value})}/>
        <textarea placeholder="Notes" value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})}/>
        <button onClick={submit}>Create Lead</button>
      </div>

      <h3 style={{ marginTop: 24 }}>Recent</h3>
      <ul>
        {leads.map(l => (
          <li key={l.id}>
            <b>{l.name}</b> — {l.phone} — {l.address}
          </li>
        ))}
      </ul>
    </main>
  );
}
