"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiGet, apiPost } from "../api";
import StatusChip from "../components/StatusChip";
import NumberInput from "../components/NumberInput";

type LineItem = {
  name: string;
  description: string;
  qty: number;
  unit_price: number;
};

export default function EstimatesPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [estimates, setEstimates] = useState<any[]>([]);
  const [approvalEstimates, setApprovalEstimates] = useState<any[]>([]);
  const [crews, setCrews] = useState<any[]>([]);
  const [salesReps, setSalesReps] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState<string>("");
  const [status, setStatus] = useState("draft");
  const [taxRate, setTaxRate] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [serviceAddress, setServiceAddress] = useState("");
  const [scope, setScope] = useState("");
  const [hazards, setHazards] = useState("");
  const [equipment, setEquipment] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { name: "Tree removal", description: "", qty: 1, unit_price: 0 },
  ]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [activeTab, setActiveTab] = useState<"builder" | "approve">("builder");
  const [selectedEstimateId, setSelectedEstimateId] = useState<string>("");
  const [scheduledStart, setScheduledStart] = useState("");
  const [scheduledEnd, setScheduledEnd] = useState("");
  const [crewId, setCrewId] = useState<string>("");
  const [salesRepId, setSalesRepId] = useState<string>("");

  async function refresh() {
    const [customerItems, estimateItems, sentEstimates, approvedEstimates, crewItems, salesRepItems] =
      await Promise.all([
        apiGet("/customers"),
        apiGet("/estimates", { q: search, status: statusFilter || undefined }),
        apiGet("/estimates", { status: "sent" }),
        apiGet("/estimates", { status: "approved" }),
        apiGet("/crews"),
        apiGet("/sales-reps"),
      ]);
    setCustomers(customerItems);
    setEstimates(estimateItems);
    const approvalList = [...(sentEstimates || []), ...(approvedEstimates || [])];
    setApprovalEstimates(approvalList);
    setCrews(crewItems || []);
    setSalesReps(salesRepItems || []);
    if (!customerId && customerItems.length) {
      setCustomerId(String(customerItems[0].id));
    }
    if (!selectedEstimateId && approvalList.length) {
      setSelectedEstimateId(String(approvalList[0].id));
    }
    if (!crewId && crewItems?.length) {
      setCrewId(String(crewItems[0].id));
    }
  }

  useEffect(() => {
    refresh();
  }, [search, statusFilter]);

  useEffect(() => {
    const customer = customers.find((item) => String(item.id) === customerId);
    if (customer && !serviceAddress) {
      setServiceAddress(customer.service_address || "");
    }
  }, [customerId, customers, serviceAddress]);

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
    const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
    const taxAmount = Number(((subtotal * taxRate) / 100).toFixed(2));
    await apiPost("/estimates", {
      customer_id: Number(customerId),
      sales_rep_id: salesRepId ? Number(salesRepId) : null,
      status,
      service_address: serviceAddress,
      scope,
      hazards,
      equipment,
      tax: taxAmount,
      discount,
      line_items: items,
    });
    setStatus("draft");
    setTaxRate(0);
    setDiscount(0);
    setServiceAddress("");
    setScope("");
    setHazards("");
    setEquipment("");
    setLineItems([{ name: "Tree removal", description: "", qty: 1, unit_price: 0 }]);
    await refresh();
  }

  async function approveAndCreateJob() {
    if (!selectedEstimateId) return;
    const job = await apiPost(`/estimates/${selectedEstimateId}/convert`, {
      scheduled_start: scheduledStart ? `${scheduledStart}T00:00:00` : null,
      scheduled_end: scheduledEnd ? `${scheduledEnd}T00:00:00` : null,
      crew_id: crewId ? Number(crewId) : null,
      status: "scheduled",
    });
    if (job?.id) {
      router.push(`/jobs/${job.id}`);
    }
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
        <div className="table-actions">
          <button
            className={activeTab === "builder" ? "btn btn-primary" : "btn btn-secondary"}
            onClick={() => setActiveTab("builder")}
          >
            New Estimate
          </button>
          <button
            className={activeTab === "approve" ? "btn btn-primary" : "btn btn-secondary"}
            onClick={() => setActiveTab("approve")}
          >
            Approve & Create Job
          </button>
        </div>
      </header>

      {activeTab === "builder" && (
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
            <label className="label">Sales rep</label>
            <select className="select" value={salesRepId} onChange={(e) => setSalesRepId(e.target.value)}>
              <option value="">Unassigned</option>
              {salesReps.map((rep) => (
                <option key={rep.id} value={rep.id}>
                  {rep.name}
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
            <label className="label">Tax rate</label>
            <NumberInput
              className="input"
              value={taxRate}
              onValueChange={setTaxRate}
              suffix="%"
            />
          </div>
          <div className="field">
            <label className="label">Discount</label>
            <NumberInput
              className="input"
              value={discount}
              onValueChange={setDiscount}
              prefix="$"
            />
          </div>
          <div className="field field-full">
            <label className="label">Service address</label>
            <input
              className="input"
              value={serviceAddress}
              onChange={(e) => setServiceAddress(e.target.value)}
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
                  <NumberInput
                    className="input"
                    value={item.qty}
                    onValueChange={(value) => updateItem(index, "qty", value)}
                  />
                </div>
                <div className="field">
                  <label className="label">Unit price</label>
                  <NumberInput
                    className="input"
                    value={item.unit_price}
                    onValueChange={(value) => updateItem(index, "unit_price", value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="form-actions">
          <button className="btn btn-primary" onClick={createEstimate}>
            Create Estimate
          </button>
        </div>
      </section>
      )}

      {activeTab === "approve" && (
        <section className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Approve estimate & create job</div>
              <p className="card-subtitle">
                Once approved, this will create a job and take you to scheduling.
              </p>
            </div>
            <span className="badge">Workflow</span>
          </div>
          <div className="form-grid">
            <div className="field">
              <label className="label">Estimate</label>
              <select
                className="select"
                value={selectedEstimateId}
                onChange={(e) => setSelectedEstimateId(e.target.value)}
              >
                {approvalEstimates.map((estimate) => {
                  const customerName =
                    customers.find((item) => item.id === estimate.customer_id)?.name ||
                    `Customer #${estimate.customer_id}`;
                  const salesRep = salesReps.find((rep) => rep.id === estimate.sales_rep_id);
                  return (
                    <option key={estimate.id} value={estimate.id}>
                      Estimate #{estimate.id} · {customerName} · {salesRep?.name || "Sales rep unassigned"}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="field">
              <label className="label">Scheduled start</label>
              <input
                className="input"
                type="date"
                value={scheduledStart}
                onChange={(e) => setScheduledStart(e.target.value)}
              />
            </div>
            <div className="field">
              <label className="label">Scheduled end</label>
              <input
                className="input"
                type="date"
                value={scheduledEnd}
                onChange={(e) => setScheduledEnd(e.target.value)}
              />
            </div>
            <div className="field">
              <label className="label">Crew</label>
              <select className="select" value={crewId} onChange={(e) => setCrewId(e.target.value)}>
                <option value="">Unassigned</option>
                {crews.map((crew) => (
                  <option key={crew.id} value={crew.id}>
                    {crew.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" onClick={approveAndCreateJob}>
              Approve + Create Job
            </button>
          </div>
          <div className="section">
            {approvalEstimates.length === 0 ? (
              <p className="card-subtitle">No sent or approved estimates available.</p>
            ) : (
              <table className="table section">
                <thead>
                  <tr>
                    <th>Estimate</th>
                    <th>Customer</th>
                    <th>Sales rep</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {approvalEstimates.slice(0, 5).map((estimate) => {
                    const salesRep = salesReps.find((rep) => rep.id === estimate.sales_rep_id);
                    return (
                      <tr key={estimate.id}>
                        <td>Estimate #{estimate.id}</td>
                        <td>
                          {customers.find((item) => item.id === estimate.customer_id)?.name ||
                            `Customer #${estimate.customer_id}`}
                        </td>
                        <td>{salesRep?.name || "Sales rep unassigned"}</td>
                        <td>
                          <StatusChip status={estimate.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}

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
                <th>Sales rep</th>
                <th>Address</th>
                <th>Total</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {estimates.map((estimate) => {
                const customer = customers.find((item) => item.id === estimate.customer_id);
                const salesRep = salesReps.find((rep) => rep.id === estimate.sales_rep_id);
                return (
                  <tr key={estimate.id}>
                    <td>Estimate #{estimate.id}</td>
                    <td>{customer?.name || `Customer #${estimate.customer_id}`}</td>
                    <td>{salesRep?.name || (estimate.sales_rep_id ? `Rep #${estimate.sales_rep_id}` : "-")}</td>
                    <td>{estimate.service_address || customer?.service_address || "-"}</td>
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
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
