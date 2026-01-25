"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, apiPost } from "../api";
import NumberInput from "../components/NumberInput";

const emptyForm = {
  name: "",
  company_name: "",
  phone: "",
  email: "",
  billing_address: "",
  service_address: "",
  notes: "",
  tags: "",
};

type FollowUpRule = {
  id: string;
  name: string;
  segment: string;
  channel: "Email" | "SMS" | "Call";
  cadenceDays: number;
  lastRun: string;
  status: "active" | "paused";
  template: string;
};

const initialFollowUps: FollowUpRule[] = [
  {
    id: "followup-1",
    name: "Post-service check-in",
    segment: "Completed jobs",
    channel: "Email",
    cadenceDays: 14,
    lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
    template: "Thanks again for trusting ArborSoftAI. Need anything else on the property?",
  },
  {
    id: "followup-2",
    name: "Dormant customer touch",
    segment: "No activity 90+ days",
    channel: "SMS",
    cadenceDays: 30,
    lastRun: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    status: "paused",
    template: "Quick check-in on your trees. Ready for a seasonal inspection?",
  },
];

function formatFollowUpDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not scheduled";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [followUps, setFollowUps] = useState<FollowUpRule[]>(initialFollowUps);
  const [followUpForm, setFollowUpForm] = useState({
    name: "",
    segment: "All customers",
    channel: "Email" as FollowUpRule["channel"],
    cadenceDays: 30,
    status: "active" as FollowUpRule["status"],
    template: "",
  });

  async function refresh() {
    setCustomers(await apiGet("/customers", { q: search, tag }));
  }

  useEffect(() => {
    refresh();
  }, [search, tag]);

  async function createCustomer() {
    if (!form.name.trim()) return;
    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    await apiPost("/customers", {
      name: form.name,
      company_name: form.company_name || null,
      phone: form.phone,
      email: form.email,
      billing_address: form.billing_address,
      service_address: form.service_address,
      notes: form.notes,
      tags,
    });
    setForm(emptyForm);
    await refresh();
  }

  function addFollowUpRule() {
    if (!followUpForm.name.trim()) return;
    const nextRule: FollowUpRule = {
      id: `followup-${Date.now()}`,
      name: followUpForm.name.trim(),
      segment: followUpForm.segment,
      channel: followUpForm.channel,
      cadenceDays: Math.max(1, Number(followUpForm.cadenceDays) || 1),
      lastRun: new Date().toISOString(),
      status: followUpForm.status,
      template: followUpForm.template.trim(),
    };
    setFollowUps((prev) => [nextRule, ...prev]);
    setFollowUpForm({
      name: "",
      segment: "All customers",
      channel: "Email",
      cadenceDays: 30,
      status: "active",
      template: "",
    });
  }

  function toggleFollowUpStatus(id: string) {
    setFollowUps((prev) =>
      prev.map((rule) =>
        rule.id === id ? { ...rule, status: rule.status === "active" ? "paused" : "active" } : rule,
      ),
    );
  }

  function runFollowUpNow(id: string) {
    setFollowUps((prev) =>
      prev.map((rule) => (rule.id === id ? { ...rule, lastRun: new Date().toISOString() } : rule)),
    );
  }

  function removeFollowUp(id: string) {
    setFollowUps((prev) => prev.filter((rule) => rule.id !== id));
  }

  const activeFollowUps = followUps.filter((rule) => rule.status === "active").length;
  const pausedFollowUps = followUps.filter((rule) => rule.status === "paused").length;

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Customers</p>
          <h2 className="page-title">Customer directory</h2>
          <p className="page-subtitle">
            Keep billing and service locations aligned for every property.
          </p>
        </div>
        <button className="btn btn-primary" onClick={createCustomer}>
          New Customer
        </button>
      </header>

      <section className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Add customer</div>
            <p className="card-subtitle">Capture core contact and service details.</p>
          </div>
          <span className="badge">Intake</span>
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
            <label className="label">Company</label>
            <input
              className="input"
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
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
          <div className="field">
            <label className="label">Email</label>
            <input
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="field field-full">
            <label className="label">Service address</label>
            <input
              className="input"
              value={form.service_address}
              onChange={(e) => setForm({ ...form, service_address: e.target.value })}
            />
          </div>
          <div className="field field-full">
            <label className="label">Billing address</label>
            <input
              className="input"
              value={form.billing_address}
              onChange={(e) => setForm({ ...form, billing_address: e.target.value })}
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
          <div className="field">
            <label className="label">Tags</label>
            <input
              className="input"
              placeholder="priority, commercial"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
            />
          </div>
        </div>
      </section>

      <section className="card section">
        <div className="card-header">
          <div>
            <div className="card-title">All customers</div>
            <p className="card-subtitle">Search, filter, and open customer profiles.</p>
          </div>
          <span className="badge">{customers.length} total</span>
        </div>
        <div className="filters section">
          <input
            className="input"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <input
            className="input"
            placeholder="Filter by tag"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
          />
        </div>
        {customers.length === 0 ? (
          <p className="card-subtitle section">No customers found.</p>
        ) : (
          <table className="table section">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Tags</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.name}</td>
                  <td>
                    {customer.phone}
                    <div className="list-meta">{customer.email}</div>
                  </td>
                  <td>{customer.tags?.join(", ")}</td>
                  <td>
                    <Link className="btn btn-secondary" href={`/customers/${customer.id}`}>
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
            <div className="card-title">Automated follow-ups</div>
            <p className="card-subtitle">Queue recurring touchpoints for customer segments.</p>
          </div>
          <div className="followup-badges">
            <span className="badge">{activeFollowUps} active</span>
            <span className="badge">{pausedFollowUps} paused</span>
          </div>
        </div>

        <div className="followup-layout">
          <div className="list followup-list">
            {followUps.length === 0 ? (
              <p className="card-subtitle">No follow-up automations configured.</p>
            ) : (
              followUps.map((rule) => {
                const nextRun = addDays(new Date(rule.lastRun), rule.cadenceDays);
                return (
                  <div key={rule.id} className="list-item followup-item">
                    <div>
                      <div className="list-title">{rule.name}</div>
                      <div className="list-meta">
                        {rule.segment} • {rule.channel} • Every {rule.cadenceDays} days
                      </div>
                      <div className="followup-meta">
                        Last sent {formatFollowUpDate(rule.lastRun)} · Next {formatFollowUpDate(nextRun.toISOString())}
                      </div>
                    </div>
                    <div className="table-actions">
                      <span className={`chip ${rule.status === "active" ? "chip-green" : "chip-gray"}`}>
                        {rule.status === "active" ? "Active" : "Paused"}
                      </span>
                      <button className="btn btn-secondary" onClick={() => runFollowUpNow(rule.id)}>
                        Run now
                      </button>
                      <button className="btn btn-ghost" onClick={() => toggleFollowUpStatus(rule.id)}>
                        {rule.status === "active" ? "Pause" : "Resume"}
                      </button>
                      <button className="btn btn-ghost" onClick={() => removeFollowUp(rule.id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="panel followup-panel">
            <div className="card-header">
              <div>
                <div className="card-title">New automation</div>
                <p className="card-subtitle">Create a recurring follow-up cadence.</p>
              </div>
            </div>
            <div className="form-grid">
              <div className="field field-full">
                <label className="label">Automation name</label>
                <input
                  className="input"
                  value={followUpForm.name}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, name: e.target.value })}
                  placeholder="Seasonal pruning reminder"
                />
              </div>
              <div className="field">
                <label className="label">Segment</label>
                <select
                  className="select"
                  value={followUpForm.segment}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, segment: e.target.value })}
                >
                  <option>All customers</option>
                  <option>Completed jobs</option>
                  <option>Estimate pending</option>
                  <option>No activity 90+ days</option>
                </select>
              </div>
              <div className="field">
                <label className="label">Channel</label>
                <select
                  className="select"
                  value={followUpForm.channel}
                  onChange={(e) =>
                    setFollowUpForm({ ...followUpForm, channel: e.target.value as FollowUpRule["channel"] })
                  }
                >
                  <option>Email</option>
                  <option>SMS</option>
                  <option>Call</option>
                </select>
              </div>
              <div className="field">
                <label className="label">Cadence (days)</label>
                <NumberInput
                  className="input"
                  min={1}
                  value={followUpForm.cadenceDays}
                  onValueChange={(value) => setFollowUpForm({ ...followUpForm, cadenceDays: value })}
                />
              </div>
              <div className="field">
                <label className="label">Status</label>
                <select
                  className="select"
                  value={followUpForm.status}
                  onChange={(e) =>
                    setFollowUpForm({ ...followUpForm, status: e.target.value as FollowUpRule["status"] })
                  }
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                </select>
              </div>
              <div className="field field-full">
                <label className="label">Template</label>
                <textarea
                  className="textarea"
                  value={followUpForm.template}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, template: e.target.value })}
                  placeholder="Hi {{name}}, ready for a tree health check-in?"
                />
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" onClick={addFollowUpRule} disabled={!followUpForm.name.trim()}>
                  Add automation
                </button>
                {!followUpForm.name.trim() ? (
                  <span className="form-hint">Name the automation to enable saving.</span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
