"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, apiPost } from "../api";

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

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState("");
  const [form, setForm] = useState(emptyForm);

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
    </main>
  );
}
