"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiGet, apiPost, apiPut } from "../../api";
import StatusChip from "../../components/StatusChip";
import NumberInput from "../../components/NumberInput";

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [invoice, setInvoice] = useState<any | null>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [taxRate, setTaxRate] = useState(0);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [paymentNote, setPaymentNote] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentCaption, setAttachmentCaption] = useState("");

  async function load() {
    const [inv, files] = await Promise.all([
      apiGet(`/invoices/${id}`),
      apiGet("/attachments", { entity_type: "invoice", entity_id: id }),
    ]);
    setInvoice(inv);
    const rate = inv.subtotal ? (inv.tax / inv.subtotal) * 100 : 0;
    setTaxRate(Number(rate.toFixed(2)));
    setAttachments(files || []);
  }

  useEffect(() => {
    if (id) load();
  }, [id]);

  async function save() {
    if (!invoice) return;
    const updated = await apiPut(`/invoices/${id}`, invoice);
    setInvoice(updated);
  }

  async function recordPayment() {
    if (paymentAmount <= 0) return;
    await apiPost(`/invoices/${id}/payments`, {
      invoice_id: Number(id),
      amount: paymentAmount,
      method: paymentMethod,
      note: paymentNote,
    });
    setPaymentAmount(0);
    setPaymentNote("");
    await load();
  }

  async function addAttachment() {
    if (!attachmentUrl) return;
    await apiPost("/attachments", {
      entity_type: "invoice",
      entity_id: Number(id),
      url: attachmentUrl,
      caption: attachmentCaption,
    });
    setAttachmentUrl("");
    setAttachmentCaption("");
    await load();
  }

  if (!invoice) {
    return (
      <main className="page">
        <p className="card-subtitle">Loading invoice...</p>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Invoice</p>
          <h2 className="page-title">Invoice #{invoice.id}</h2>
          <p className="page-subtitle">Track payments and balances.</p>
        </div>
        <button className="btn btn-primary" onClick={save}>
          Save Changes
        </button>
      </header>

      <div className="page-grid">
        <section className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Invoice details</div>
              <p className="card-subtitle">Update status and totals.</p>
            </div>
            <StatusChip status={invoice.status} />
          </div>
          <div className="form-grid">
            <div className="field">
              <label className="label">Status</label>
              <select
                className="select"
                value={invoice.status}
                onChange={(e) => setInvoice({ ...invoice, status: e.target.value })}
              >
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            <div className="field">
              <label className="label">Subtotal</label>
              <NumberInput
                className="input"
                value={invoice.subtotal}
                onValueChange={(subtotal) => {
                  const taxAmount = Number(((subtotal * taxRate) / 100).toFixed(2));
                  setInvoice({ ...invoice, subtotal, tax: taxAmount, total: subtotal + taxAmount });
                }}
                prefix="$"
              />
            </div>
            <div className="field">
              <label className="label">Tax rate</label>
              <NumberInput
                className="input"
                value={taxRate}
                onValueChange={(rate) => {
                  setTaxRate(rate);
                  const taxAmount = Number(((invoice.subtotal * rate) / 100).toFixed(2));
                  setInvoice({ ...invoice, tax: taxAmount, total: invoice.subtotal + taxAmount });
                }}
                suffix="%"
              />
            </div>
            <div className="field">
              <label className="label">Total</label>
              <input className="input" type="number" value={invoice.total} disabled />
            </div>
            <div className="field">
              <label className="label">Due date</label>
              <input
                className="input"
                value={invoice.due_date ?? ""}
                onChange={(e) => setInvoice({ ...invoice, due_date: e.target.value })}
              />
            </div>
            <div className="field field-full">
              <label className="label">Notes</label>
              <textarea
                className="textarea"
                value={invoice.notes}
                onChange={(e) => setInvoice({ ...invoice, notes: e.target.value })}
              />
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Record payment</div>
              <p className="card-subtitle">Apply a payment and update status.</p>
            </div>
            <span className="badge">Payments</span>
          </div>
          <div className="form-grid">
            <div className="field">
              <label className="label">Amount</label>
              <NumberInput
                className="input"
                value={paymentAmount}
                onValueChange={setPaymentAmount}
                prefix="$"
              />
            </div>
            <div className="field">
              <label className="label">Method</label>
              <select className="select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="card">Card</option>
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="ach">ACH</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="field field-full">
              <label className="label">Note</label>
              <input
                className="input"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
              />
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={recordPayment}>
                Record Payment
              </button>
            </div>
          </div>
          <ul className="list section">
            {invoice.payments?.map((payment: any) => (
              <li key={payment.id} className="list-item">
                <div>
                  <div className="list-title">${payment.amount}</div>
                  <div className="list-meta">{payment.method} · {payment.paid_at?.slice?.(0, 10)}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card section">
        <div className="card-header">
          <div>
            <div className="card-title">Attachments</div>
            <p className="card-subtitle">Store invoices and receipts.</p>
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
