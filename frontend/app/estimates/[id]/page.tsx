"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiGet, apiPost, apiPut } from "../../api";
import StatusChip from "../../components/StatusChip";
import NumberInput from "../../components/NumberInput";

type LineItem = {
  name: string;
  description?: string;
  qty: number;
  unit_price: number;
  total?: number;
  sort_order?: number;
};

export default function EstimateDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [estimate, setEstimate] = useState<any | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [crews, setCrews] = useState<any[]>([]);
  const [taxRate, setTaxRate] = useState(0);
  const [scheduleStart, setScheduleStart] = useState("");
  const [scheduleEnd, setScheduleEnd] = useState("");
  const [crewId, setCrewId] = useState<string>("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentCaption, setAttachmentCaption] = useState("");

  async function load() {
    const [est, files, crewItems] = await Promise.all([
      apiGet(`/estimates/${id}`),
      apiGet("/attachments", { entity_type: "estimate", entity_id: id }),
      apiGet("/crews"),
    ]);
    setEstimate(est);
    const items = est.line_items || [];
    setLineItems(items);
    const subtotal = items.reduce((sum: number, item: LineItem) => sum + item.qty * item.unit_price, 0);
    const rate = subtotal ? (est.tax / subtotal) * 100 : 0;
    setTaxRate(Number(rate.toFixed(2)));
    setAttachments(files || []);
    setCrews(crewItems || []);
    if (!crewId && crewItems.length) setCrewId(String(crewItems[0].id));
  }

  useEffect(() => {
    if (id) load();
  }, [id]);

  function updateLineItem(index: number, key: keyof LineItem, value: string | number) {
    setLineItems((items) =>
      items.map((item, idx) =>
        idx === index ? { ...item, [key]: value } : item,
      ),
    );
  }

  async function save() {
    if (!estimate) return;
    const subtotal = lineItems.reduce((sum, item) => sum + item.qty * item.unit_price, 0);
    const taxAmount = Number(((subtotal * taxRate) / 100).toFixed(2));
    const payload = {
      ...estimate,
      tax: taxAmount,
      line_items: lineItems.map((item, idx) => ({
        ...item,
        total: item.qty * item.unit_price,
        sort_order: idx,
      })),
    };
    const updated = await apiPut(`/estimates/${id}`, payload);
    setEstimate(updated);
    const updatedItems = updated.line_items || [];
    setLineItems(updatedItems);
    const updatedSubtotal = updatedItems.reduce(
      (sum: number, item: LineItem) => sum + item.qty * item.unit_price,
      0,
    );
    const updatedRate = updatedSubtotal ? (updated.tax / updatedSubtotal) * 100 : taxRate;
    setTaxRate(Number(updatedRate.toFixed(2)));
  }

  async function updateStatus(next: string) {
    const updated = await apiPut(`/estimates/${id}`, { status: next });
    setEstimate(updated);
  }

  async function convertToJob() {
    await apiPost(`/estimates/${id}/convert`, {
      scheduled_start: scheduleStart || null,
      scheduled_end: scheduleEnd || null,
      crew_id: crewId ? Number(crewId) : null,
      notes: estimate?.notes || "",
      status: "scheduled",
    });
    await load();
  }

  async function addAttachment() {
    if (!attachmentUrl) return;
    await apiPost("/attachments", {
      entity_type: "estimate",
      entity_id: Number(id),
      url: attachmentUrl,
      caption: attachmentCaption,
    });
    setAttachmentUrl("");
    setAttachmentCaption("");
    await load();
  }

  if (!estimate) {
    return (
      <main className="page">
        <p className="card-subtitle">Loading estimate...</p>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Estimate</p>
          <h2 className="page-title">Estimate #{estimate.id}</h2>
          <p className="page-subtitle">Track status, scope, and approvals.</p>
        </div>
        <div className="table-actions">
          <button className="btn btn-secondary" onClick={() => updateStatus("sent")}>
            Mark Sent
          </button>
          <button className="btn btn-secondary" onClick={() => updateStatus("approved")}>
            Approve
          </button>
          <button className="btn btn-secondary" onClick={() => updateStatus("rejected")}>
            Reject
          </button>
          <button className="btn btn-primary" onClick={save}>
            Save Changes
          </button>
        </div>
      </header>

      <div className="page-grid">
        <section className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Estimate details</div>
              <p className="card-subtitle">Update pricing and scope.</p>
            </div>
            <StatusChip status={estimate.status} />
          </div>
          <div className="form-grid">
            <div className="field">
              <label className="label">Customer ID</label>
              <input className="input" value={estimate.customer_id} disabled />
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
                value={estimate.discount}
                onValueChange={(value) => setEstimate({ ...estimate, discount: value })}
                prefix="$"
              />
            </div>
            <div className="field">
              <label className="label">Total</label>
              <input className="input" type="number" value={estimate.total} disabled />
            </div>
            <div className="field field-full">
              <label className="label">Service address</label>
              <input
                className="input"
                value={estimate.service_address || ""}
                onChange={(e) => setEstimate({ ...estimate, service_address: e.target.value })}
              />
            </div>
            <div className="field field-full">
              <label className="label">Scope</label>
              <textarea
                className="textarea"
                value={estimate.scope}
                onChange={(e) => setEstimate({ ...estimate, scope: e.target.value })}
              />
            </div>
            <div className="field field-full">
              <label className="label">Hazards</label>
              <textarea
                className="textarea"
                value={estimate.hazards}
                onChange={(e) => setEstimate({ ...estimate, hazards: e.target.value })}
              />
            </div>
            <div className="field field-full">
              <label className="label">Equipment</label>
              <textarea
                className="textarea"
                value={estimate.equipment}
                onChange={(e) => setEstimate({ ...estimate, equipment: e.target.value })}
              />
            </div>
            <div className="field field-full">
              <label className="label">Notes</label>
              <textarea
                className="textarea"
                value={estimate.notes}
                onChange={(e) => setEstimate({ ...estimate, notes: e.target.value })}
              />
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Convert to job</div>
              <p className="card-subtitle">Move approved estimates into the schedule.</p>
            </div>
            <span className="badge">Workflow</span>
          </div>
          <div className="field">
            <label className="label">Scheduled start</label>
            <input
              className="input"
              placeholder="2026-01-24T08:00:00"
              value={scheduleStart}
              onChange={(e) => setScheduleStart(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="label">Scheduled end</label>
            <input
              className="input"
              placeholder="2026-01-24T16:00:00"
              value={scheduleEnd}
              onChange={(e) => setScheduleEnd(e.target.value)}
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
          <div className="form-actions">
            <button className="btn btn-primary" onClick={convertToJob}>
              Convert to Job
            </button>
          </div>
        </section>
      </div>

      <section className="card section">
        <div className="card-header">
          <div>
            <div className="card-title">Line items</div>
            <p className="card-subtitle">Edit scope pricing.</p>
          </div>
        </div>
        <div className="form-grid">
          {lineItems.map((item, index) => (
            <div key={index} className="panel">
              <div className="field">
                <label className="label">Item</label>
                <input
                  className="input"
                  value={item.name}
                  onChange={(e) => updateLineItem(index, "name", e.target.value)}
                />
              </div>
              <div className="field">
                <label className="label">Description</label>
                <input
                  className="input"
                  value={item.description || ""}
                  onChange={(e) => updateLineItem(index, "description", e.target.value)}
                />
              </div>
              <div className="field">
                <label className="label">Qty</label>
                <NumberInput
                  className="input"
                  value={item.qty}
                  onValueChange={(value) => updateLineItem(index, "qty", value)}
                />
              </div>
              <div className="field">
                <label className="label">Unit price</label>
                <NumberInput
                  className="input"
                  value={item.unit_price}
                  onValueChange={(value) => updateLineItem(index, "unit_price", value)}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card section">
        <div className="card-header">
          <div>
            <div className="card-title">Attachments</div>
            <p className="card-subtitle">Photos and supporting documents.</p>
          </div>
          <span className="badge">{attachments.length} files</span>
        </div>
        <div className="form-grid">
          <div className="field">
            <label className="label">Photo URL</label>
            <input
              className="input"
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="label">Caption</label>
            <input
              className="input"
              value={attachmentCaption}
              onChange={(e) => setAttachmentCaption(e.target.value)}
            />
          </div>
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={addAttachment}>
              Add Attachment
            </button>
          </div>
        </div>
        <ul className="list section">
          {attachments.map((file) => (
            <li key={file.id} className="list-item">
              <div>
                <div className="list-title">{file.caption || "Attachment"}</div>
                <div className="list-meta">{file.url}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
