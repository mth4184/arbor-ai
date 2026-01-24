"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiGet, apiPost, apiPut } from "../../api";
import StatusChip from "../../components/StatusChip";

export default function EquipmentDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [equipment, setEquipment] = useState<any | null>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentCaption, setAttachmentCaption] = useState("");

  async function load() {
    const [item, files] = await Promise.all([
      apiGet(`/equipment/${id}`),
      apiGet("/attachments", { entity_type: "equipment", entity_id: id }),
    ]);
    setEquipment(item);
    setAttachments(files || []);
  }

  useEffect(() => {
    if (id) load();
  }, [id]);

  async function save() {
    if (!equipment) return;
    const updated = await apiPut(`/equipment/${id}`, equipment);
    setEquipment(updated);
  }

  async function addAttachment() {
    if (!attachmentUrl) return;
    await apiPost("/attachments", {
      entity_type: "equipment",
      entity_id: Number(id),
      url: attachmentUrl,
      caption: attachmentCaption,
    });
    setAttachmentUrl("");
    setAttachmentCaption("");
    await load();
  }

  if (!equipment) {
    return (
      <main className="page">
        <p className="card-subtitle">Loading equipment...</p>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Equipment</p>
          <h2 className="page-title">{equipment.name}</h2>
          <p className="page-subtitle">Track usage, maintenance, and notes.</p>
        </div>
        <button className="btn btn-primary" onClick={save}>
          Save Changes
        </button>
      </header>

      <div className="page-grid">
        <section className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Equipment details</div>
              <p className="card-subtitle">Update status and notes.</p>
            </div>
            <StatusChip status={equipment.status} />
          </div>
          <div className="form-grid">
            <div className="field">
              <label className="label">Name</label>
              <input
                className="input"
                value={equipment.name}
                onChange={(e) => setEquipment({ ...equipment, name: e.target.value })}
              />
            </div>
            <div className="field">
              <label className="label">Type</label>
              <input
                className="input"
                value={equipment.type}
                onChange={(e) => setEquipment({ ...equipment, type: e.target.value })}
              />
            </div>
            <div className="field">
              <label className="label">Status</label>
              <select
                className="select"
                value={equipment.status}
                onChange={(e) => setEquipment({ ...equipment, status: e.target.value })}
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
                value={equipment.notes}
                onChange={(e) => setEquipment({ ...equipment, notes: e.target.value })}
              />
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Attachments</div>
              <p className="card-subtitle">Service logs and photos.</p>
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
