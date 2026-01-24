"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiGet, apiPost, apiPut } from "../../api";
import StatusChip from "../../components/StatusChip";

export default function LeadDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [lead, setLead] = useState<any | null>(null);
  const [customer, setCustomer] = useState<any | null>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentCaption, setAttachmentCaption] = useState("");

  async function load() {
    const leadItem = await apiGet(`/leads/${id}`);
    const [customerItem, files] = await Promise.all([
      apiGet(`/customers/${leadItem.customer_id}`),
      apiGet("/attachments", { entity_type: "lead", entity_id: id }),
    ]);
    setLead(leadItem);
    setCustomer(customerItem);
    setAttachments(files || []);
  }

  useEffect(() => {
    if (id) load();
  }, [id]);

  async function save() {
    if (!lead) return;
    const updated = await apiPut(`/leads/${id}`, lead);
    setLead(updated);
  }

  async function addAttachment() {
    if (!attachmentUrl) return;
    await apiPost("/attachments", {
      entity_type: "lead",
      entity_id: Number(id),
      url: attachmentUrl,
      caption: attachmentCaption,
    });
    setAttachmentUrl("");
    setAttachmentCaption("");
    await load();
  }

  if (!lead) {
    return (
      <main className="page">
        <p className="card-subtitle">Loading lead...</p>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Lead</p>
          <h2 className="page-title">Lead #{lead.id}</h2>
          <p className="page-subtitle">Update status, notes, and attachments.</p>
        </div>
        <button className="btn btn-primary" onClick={save}>
          Save Changes
        </button>
      </header>

      <div className="page-grid">
        <section className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Lead details</div>
              <p className="card-subtitle">Track source and status.</p>
            </div>
            <StatusChip status={lead.status} />
          </div>
          <div className="form-grid">
            <div className="field">
              <label className="label">Customer</label>
              <input className="input" value={customer?.name ?? `Customer #${lead.customer_id}`} disabled />
            </div>
            <div className="field">
              <label className="label">Source</label>
              <input
                className="input"
                value={lead.source ?? ""}
                onChange={(e) => setLead({ ...lead, source: e.target.value })}
              />
            </div>
            <div className="field">
              <label className="label">Status</label>
              <select
                className="select"
                value={lead.status}
                onChange={(e) => setLead({ ...lead, status: e.target.value })}
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="lost">Lost</option>
              </select>
            </div>
            <div className="field field-full">
              <label className="label">Notes</label>
              <textarea
                className="textarea"
                value={lead.notes}
                onChange={(e) => setLead({ ...lead, notes: e.target.value })}
              />
            </div>
            {customer && (
              <div className="field field-full">
                <Link className="btn btn-secondary" href={`/customers/${customer.id}`}>
                  View Customer
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Attachments</div>
              <p className="card-subtitle">Photos and intake documentation.</p>
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
      </div>
    </main>
  );
}
