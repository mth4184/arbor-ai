"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, apiPost } from "../api";
import StatusChip from "../components/StatusChip";

type LineItem = {
  name: string;
  description: string;
  qty: number;
  unit_price: number;
};

export default function EstimatesPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [estimates, setEstimates] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState<string>("");
  const [status, setStatus] = useState("draft");
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [scope, setScope] = useState("");
  const [hazards, setHazards] = useState("");
  const [equipment, setEquipment] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { name: "Tree removal", description: "", qty: 1, unit_price: 0 },
  ]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  async function refresh() {
    const [customerItems, estimateItems] = await Promise.all([
      apiGet("/customers"),
      apiGet("/estimates", { q: search, status: statusFilter || undefined }),
    ]);
    setCustomers(customerItems);
    setEstimates(estimateItems);
    if (!customerId && customerItems.length) {
      setCustomerId(String(customerItems[0].id));
    }
  }

  useEffect(() => {
    refresh();
  }, [search, statusFilter]);

  function updateItem(index: number, key: keyof LineItem, value: string | number) {
    setLineItems((items) =>
      items.map((item, idx) =>
        idx === index ? { ...item, [key]: value } : item,
      ),
    );
  }

  function addLineItem() {
    setLineItems((items) => [...items, { name: "", description: "", qty: 1, unit_price: 0 }]);
  }

  async function createEstimate() {
    if (!customerId) return;
    const items = lineItems.map((item, idx) => ({
      ...item,
      total: item.qty * item.unit_price,
      sort_order: idx,
    }));
    await apiPost("/estimates", {
      customer_id: Number(customerId),
      status,
      scope,
      hazards,
      equipment,
      tax,
      discount,
      line_items: items,
    });
    setStatus("draft");
    setTax(0);
    setDiscount(0);
    setScope("");
    setHazards("");
    setEquipment("");
    setLineItems([{ name: "Tree removal", description: "", qty: 1, unit_price: 0 }]);
    await refresh();
  }

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Estimates</p>
          <h2 className="page-title">Estimate builder</h2>
          <p className="page-subtitle">
            Build line-item proposals and send them through approval.
          </p>
        </div>
        <button className="btn btn-primary" onClick={createEstimate}>
          New Estimate
        </button>
      </header>

      <section className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Create estimate</div>
            <p className="card-subtitle">Scope, hazards, and pricing details.</p>
          </div>
          <span className="badge">Draft</span>
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
            <label className="label">Status</label>
            <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="field">
            <label className="label">Tax</label>
            <input
              className="input"
              type="number"
              value={tax}
              onChange={(e) => setTax(Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label className="label">Discount</label>
            <input
              className="input"
              type="number"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
            />
          </div>
          <div className="field field-full">
            <label className="label">Scope</label>
            <textarea
              className="textarea"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
            />
          </div>
          <div className="field field-full">
            <label className="label">Hazards</label>
            <textarea
              className="textarea"
              value={hazards}
              onChange={(e) => setHazards(e.target.value)}
            />
          </div>
          <div className="field field-full">
            <label className="label">Equipment</label>
            <textarea
              className="textarea"
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
            />
          </div>
        </div>

        <div className="card section">
          <div className="card-header">
            <div>
              <div className="card-title">Line items</div>
              <p className="card-subtitle">Define scope pricing.</p>
            </div>
            <button className="btn btn-secondary" onClick={addLineItem}>
              Add line item
            </button>
          </div>
          <div className="form-grid">
            {lineItems.map((item, index) => (
              <div key={index} className="panel">
                <div className="field">
                  <label className="label">Item</label>
                  <input
                    className="input"
                    value={item.name}
                    onChange={(e) => updateItem(index, "name", e.target.value)}
                  />
                </div>
                <div className="field">
                  <label className="label">Description</label>
                  <input
                    className="input"
                    value={item.description}
                    onChange={(e) => updateItem(index, "description", e.target.value)}
                  />
                </div>
                <div className="field">
                  <label className="label">Qty</label>
                  <input
                    className="input"
                    type="number"
                    value={item.qty}
                    onChange={(e) => updateItem(index, "qty", Number(e.target.value))}
                  />
                </div>
                <div className="field">
                  <label className="label">Unit price</label>
                  <input
                    className="input"
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => updateItem(index, "unit_price", Number(e.target.value))}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="card section">
        <div className="card-header">
          <div>
            <div className="card-title">Recent estimates</div>
            <p className="card-subtitle">Track proposal status.</p>
          </div>
          <span className="badge">{estimates.length} total</span>
        </div>
        <div className="filters section">
          <input
            className="input"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        {estimates.length === 0 ? (
          <p className="card-subtitle">No estimates yet.</p>
        ) : (
          <table className="table section">
            <thead>
              <tr>
                <th>Estimate</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {estimates.map((estimate) => (
                <tr key={estimate.id}>
                  <td>Estimate #{estimate.id}</td>
                  <td>Customer #{estimate.customer_id}</td>
                  <td>${estimate.total}</td>
                  <td>
                    <StatusChip status={estimate.status} />
                  </td>
                  <td>
                    <Link className="btn btn-secondary" href={`/estimates/${estimate.id}`}>
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
