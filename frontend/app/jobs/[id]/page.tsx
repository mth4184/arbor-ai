"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiDelete, apiGet, apiPost, apiPut } from "../../api";
import StatusChip from "../../components/StatusChip";
import NumberInput from "../../components/NumberInput";

export default function JobDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [job, setJob] = useState<any | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [crews, setCrews] = useState<any[]>([]);
  const [salesReps, setSalesReps] = useState<any[]>([]);
  const [jobTypes, setJobTypes] = useState<any[]>([]);
  const [newJobType, setNewJobType] = useState("");
  const [newTask, setNewTask] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentCaption, setAttachmentCaption] = useState("");
  const [equipmentId, setEquipmentId] = useState("");
  const [invoiceTaxRate, setInvoiceTaxRate] = useState(0);
  const [invoiceResult, setInvoiceResult] = useState<any | null>(null);

  async function load() {
    const [jobItem, files, equipmentItems, crewItems, salesRepItems, jobTypeItems] = await Promise.all([
      apiGet(`/jobs/${id}`),
      apiGet("/attachments", { entity_type: "job", entity_id: id }),
      apiGet("/equipment"),
      apiGet("/crews"),
      apiGet("/sales-reps"),
      apiGet("/job-types"),
    ]);
    setJob(jobItem);
    setTasks(jobItem.tasks || []);
    setAttachments(files || []);
    setEquipment(equipmentItems || []);
    setCrews(crewItems || []);
    setSalesReps(salesRepItems || []);
    setJobTypes(jobTypeItems || []);
  }

  useEffect(() => {
    if (id) load();
  }, [id]);

  async function saveJob() {
    if (!job) return;
    const updated = await apiPut(`/jobs/${id}`, job);
    setJob(updated);
  }

  async function addJobType() {
    if (!newJobType.trim()) return;
    const created = await apiPost("/job-types", { name: newJobType.trim() });
    setJobTypes([created, ...jobTypes]);
    setJob({ ...job, job_type_id: created.id });
    setNewJobType("");
  }

  async function addTask() {
    if (!newTask) return;
    const created = await apiPost(`/jobs/${id}/tasks`, { title: newTask, completed: false, sort_order: tasks.length });
    setTasks([...tasks, created]);
    setNewTask("");
  }

  async function toggleTask(task: any) {
    const updated = await apiPut(`/jobs/${id}/tasks/${task.id}`, {
      completed: !task.completed,
    });
    setTasks(tasks.map((t) => (t.id === task.id ? updated : t)));
  }

  async function addAttachment() {
    if (!attachmentUrl) return;
    await apiPost("/attachments", {
      entity_type: "job",
      entity_id: Number(id),
      url: attachmentUrl,
      caption: attachmentCaption,
    });
    setAttachmentUrl("");
    setAttachmentCaption("");
    await load();
  }

  async function assignEquipment() {
    if (!equipmentId) return;
    const updated = await apiPost(`/jobs/${id}/equipment`, { equipment_id: Number(equipmentId) });
    setJob(updated);
    setEquipmentId("");
  }

  async function removeEquipment(eId: number) {
    const updated = await apiDelete(`/jobs/${id}/equipment/${eId}`);
    setJob(updated);
  }

  async function completeJob() {
    const subtotal = Number(job?.total || 0);
    const taxAmount = Number(((subtotal * invoiceTaxRate) / 100).toFixed(2));
    const invoice = await apiPost(`/jobs/${id}/complete`, {
      invoice_tax: taxAmount,
    });
    setInvoiceResult(invoice);
  }

  if (!job) {
    return (
      <main className="page">
        <p className="card-subtitle">Loading job...</p>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Job</p>
          <h2 className="page-title">Job #{job.id}</h2>
          <p className="page-subtitle">Manage crew, schedule, and tasks.</p>
        </div>
        <div className="table-actions">
          <button className="btn btn-secondary" onClick={saveJob}>
            Save Changes
          </button>
          <button className="btn btn-primary" onClick={completeJob}>
            Mark Complete + Create Invoice
          </button>
        </div>
      </header>

      <div className="page-grid">
        <section className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Job details</div>
              <p className="card-subtitle">Update schedule and notes.</p>
            </div>
            <StatusChip status={job.status} />
          </div>
          <div className="form-grid">
            <div className="field">
              <label className="label">Customer ID</label>
              <input className="input" value={job.customer_id} disabled />
            </div>
            <div className="field">
              <label className="label">Crew</label>
              <select
                className="select"
                value={job.crew_id ?? ""}
                onChange={(e) => setJob({ ...job, crew_id: e.target.value ? Number(e.target.value) : null })}
              >
                <option value="">Unassigned</option>
                {crews.map((crew) => (
                  <option key={crew.id} value={crew.id}>
                    {crew.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="label">Sales rep</label>
              <select
                className="select"
                value={job.sales_rep_id ?? ""}
                onChange={(e) =>
                  setJob({ ...job, sales_rep_id: e.target.value ? Number(e.target.value) : null })
                }
              >
                <option value="">Unassigned</option>
                {salesReps.map((rep) => (
                  <option key={rep.id} value={rep.id}>
                    {rep.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="label">Job type</label>
              <select
                className="select"
                value={job.job_type_id ?? (newJobType ? "__new__" : "")}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "__new__") {
                    setJob({ ...job, job_type_id: null });
                  } else {
                    setJob({ ...job, job_type_id: value ? Number(value) : null });
                    setNewJobType("");
                  }
                }}
              >
                <option value="">Select type</option>
                {jobTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
                <option value="__new__">Add new...</option>
              </select>
              {(job.job_type_id === null || newJobType) && (
                <div className="form-actions section">
                  <input
                    className="input"
                    placeholder="New job type"
                    value={newJobType}
                    onChange={(e) => setNewJobType(e.target.value)}
                  />
                  <button className="btn btn-secondary" onClick={addJobType}>
                    Add
                  </button>
                </div>
              )}
            </div>
            <div className="field">
              <label className="label">Status</label>
              <select
                className="select"
                value={job.status}
                onChange={(e) => setJob({ ...job, status: e.target.value })}
              >
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
                <option value="canceled">Canceled</option>
              </select>
            </div>
            <div className="field">
              <label className="label">Scheduled start</label>
              <input
                className="input"
                type="date"
                value={job.scheduled_start ? String(job.scheduled_start).slice(0, 10) : ""}
                onChange={(e) =>
                  setJob({ ...job, scheduled_start: e.target.value ? `${e.target.value}T00:00:00` : null })
                }
              />
            </div>
            <div className="field">
              <label className="label">Scheduled end</label>
              <input
                className="input"
                type="date"
                value={job.scheduled_end ? String(job.scheduled_end).slice(0, 10) : ""}
                onChange={(e) =>
                  setJob({ ...job, scheduled_end: e.target.value ? `${e.target.value}T00:00:00` : null })
                }
              />
            </div>
            <div className="field">
              <label className="label">Total</label>
              <NumberInput
                className="input"
                value={job.total}
                onValueChange={(value) => setJob({ ...job, total: value })}
              />
            </div>
            <div className="field field-full">
              <label className="label">Notes</label>
              <textarea
                className="textarea"
                value={job.notes}
                onChange={(e) => setJob({ ...job, notes: e.target.value })}
              />
            </div>
            <div className="field">
              <label className="label">Invoice tax rate</label>
              <NumberInput
                className="input"
                value={invoiceTaxRate}
                onValueChange={setInvoiceTaxRate}
                suffix="%"
              />
            </div>
            {invoiceResult && (
              <div className="field field-full">
                <div className="card-subtitle">
                  Invoice created: <Link href={`/invoices/${invoiceResult.id}`}>Invoice #{invoiceResult.id}</Link>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Tasks</div>
              <p className="card-subtitle">Checklist for the crew.</p>
            </div>
            <span className="badge">{tasks.length} tasks</span>
          </div>
          <div className="field">
            <label className="label">New task</label>
            <input className="input" value={newTask} onChange={(e) => setNewTask(e.target.value)} />
          </div>
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={addTask}>
              Add Task
            </button>
          </div>
          <ul className="list section">
            {tasks.map((task) => (
              <li key={task.id} className="list-item">
                <div>
                  <div className="list-title">{task.title}</div>
                  <div className="list-meta">{task.completed ? "Completed" : "Pending"}</div>
                </div>
                <button className="btn btn-secondary" onClick={() => toggleTask(task)}>
                  Toggle
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card section">
        <div className="card-header">
          <div>
            <div className="card-title">Equipment</div>
            <p className="card-subtitle">Assign assets to the job.</p>
          </div>
          <span className="badge">{job.equipment_ids?.length ?? 0} assets</span>
        </div>
        <div className="filters section">
          <select className="select" value={equipmentId} onChange={(e) => setEquipmentId(e.target.value)}>
            <option value="">Select equipment</option>
            {equipment.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <button className="btn btn-secondary" onClick={assignEquipment}>
            Assign
          </button>
        </div>
        <ul className="list section">
          {(job.equipment_ids || []).map((eId: number) => (
            <li key={eId} className="list-item">
              <div>
                <div className="list-title">Equipment #{eId}</div>
              </div>
              <button className="btn btn-ghost" onClick={() => removeEquipment(eId)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="card section">
        <div className="card-header">
          <div>
            <div className="card-title">Attachments</div>
            <p className="card-subtitle">Store job photos for crews and customers.</p>
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
