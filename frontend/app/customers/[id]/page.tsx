"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiGet, apiPost, apiPut } from "../../api";
import SaveButton from "../../components/SaveButton";

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [customer, setCustomer] = useState<any | null>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [estimates, setEstimates] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentCaption, setAttachmentCaption] = useState("");

  async function load() {
    const [cust, files, leadItems, estimateItems, jobItems, invoiceItems] = await Promise.all([
      apiGet(`/customers/${id}`),
      apiGet("/attachments", { entity_type: "customer", entity_id: id }),
      apiGet("/leads", { customer_id: id }),
      apiGet("/estimates", { customer_id: id }),
      apiGet("/jobs", { customer_id: id }),
      apiGet("/invoices", { customer_id: id }),
    ]);
    setCustomer(cust);
    setAttachments(files || []);
    setLeads(leadItems || []);
    setEstimates(estimateItems || []);
    setJobs(jobItems || []);
    setInvoices(invoiceItems || []);
  }

  useEffect(() => {
    if (id) load();
  }, [id]);

  async function save() {
    if (!customer) return;
    const updated = await apiPut(`/customers/${id}`, customer);
    setCustomer(updated);
  }

  async function addAttachment() {
    if (!attachmentUrl) return;
    await apiPost("/attachments", {
      entity_type: "customer",
      entity_id: Number(id),
      url: attachmentUrl,
      caption: attachmentCaption,
    });
    setAttachmentUrl("");
    setAttachmentCaption("");
    await load();
  }

  if (!customer) {
    return (
      <main className="page">
        <p className="card-subtitle">Loading customer...</p>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Customer</p>
          <h2 className="page-title">{customer.name}</h2>
          <p className="page-subtitle">Maintain notes, addresses, and customer history.</p>
        </div>
        <SaveButton className="btn btn-primary" onSave={save} />
      </header>

      <div className="page-grid">
        <section className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Customer details</div>
              <p className="card-subtitle">Editable contact and service info.</p>
            </div>
            <span className="badge">Profile</span>
          </div>
          <div className="form-grid">
            <div className="field">
              <label className="label">Name</label>
              <input
                className="input"
                value={customer.name}
                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
              />
            </div>
            <div className="field">
              <label className="label">Company</label>
              <input
                className="input"
                value={customer.company_name ?? ""}
                onChange={(e) => setCustomer({ ...customer, company_name: e.target.value })}
              />
            </div>
            <div className="field">
              <label className="label">Phone</label>
              <input
                className="input"
                value={customer.phone}
                onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
              />
            </div>
            <div className="field">
              <label className="label">Email</label>
              <input
                className="input"
                value={customer.email}
                onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
              />
            </div>
            <div className="field field-full">
              <label className="label">Service address</label>
              <input
                className="input"
                value={customer.service_address}
                onChange={(e) => setCustomer({ ...customer, service_address: e.target.value })}
              />
            </div>
            <div className="field field-full">
              <label className="label">Billing address</label>
              <input
                className="input"
                value={customer.billing_address}
                onChange={(e) => setCustomer({ ...customer, billing_address: e.target.value })}
              />
            </div>
            <div className="field field-full">
              <label className="label">Notes</label>
              <textarea
                className="textarea"
                value={customer.notes}
                onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
              />
            </div>
            <div className="field field-full">
              <label className="label">Tags</label>
              <input
                className="input"
                value={(customer.tags || []).join(", ")}
                onChange={(e) =>
                  setCustomer({
                    ...customer,
                    tags: e.target.value.split(",").map((tag: string) => tag.trim()).filter(Boolean),
                  })
                }
              />
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Attachments</div>
              <p className="card-subtitle">Store photo URLs for the account.</p>
            </div>
            <span className="badge">{attachments.length} files</span>
          </div>
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

      <section className="card section">
        <div className="card-header">
          <div>
            <div className="card-title">Customer history</div>
            <p className="card-subtitle">Leads, estimates, jobs, and invoices.</p>
          </div>
          <span className="badge">{estimates.length + jobs.length} records</span>
        </div>
        <div className="panel-grid">
          <div className="panel">
            <div className="list-title">Leads</div>
            <p className="list-meta">{leads.length} inquiries</p>
            <ul className="list section">
              {leads.map((lead) => (
                <li key={lead.id} className="list-item">
                  <div className="list-title">Lead #{lead.id}</div>
                  <div className="list-meta">{lead.status}</div>
                </li>
              ))}
            </ul>
          </div>
          <div className="panel">
            <div className="list-title">Estimates</div>
            <p className="list-meta">{estimates.length} estimates</p>
            <ul className="list section">
              {estimates.map((estimate) => (
                <li key={estimate.id} className="list-item">
                  <div>
                    <div className="list-title">Estimate #{estimate.id}</div>
                    <div className="list-meta">${estimate.total}</div>
                  </div>
                  <Link className="btn btn-secondary" href={`/estimates/${estimate.id}`}>
                    View
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="panel">
            <div className="list-title">Jobs</div>
            <p className="list-meta">{jobs.length} jobs</p>
            <ul className="list section">
              {jobs.map((job) => (
                <li key={job.id} className="list-item">
                  <div>
                    <div className="list-title">Job #{job.id}</div>
                    <div className="list-meta">{job.status}</div>
                  </div>
                  <Link className="btn btn-secondary" href={`/jobs/${job.id}`}>
                    Open
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="panel">
            <div className="list-title">Invoices</div>
            <p className="list-meta">{invoices.length} invoices</p>
            <ul className="list section">
              {invoices.map((invoice) => (
                <li key={invoice.id} className="list-item">
                  <div>
                    <div className="list-title">Invoice #{invoice.id}</div>
                    <div className="list-meta">${invoice.total}</div>
                  </div>
                  <Link className="btn btn-secondary" href={`/invoices/${invoice.id}`}>
                    Open
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
