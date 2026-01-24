"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { apiGet, apiPost, apiPut } from "../../api";
import StatusChip from "../../components/StatusChip";
import NumberInput from "../../components/NumberInput";

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [invoice, setInvoice] = useState<any | null>(null);
  const [customerName, setCustomerName] = useState<string>("");
  const [customer, setCustomer] = useState<any | null>(null);
  const [settings, setSettings] = useState<any | null>(null);
  const [job, setJob] = useState<any | null>(null);
  const [estimate, setEstimate] = useState<any | null>(null);
  const [lineItems, setLineItems] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [taxRate, setTaxRate] = useState(0);
  const [dueDate, setDueDate] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [paymentNote, setPaymentNote] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentCaption, setAttachmentCaption] = useState("");
  const pdfRef = useRef<HTMLDivElement | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const paidTotal = invoice?.payments?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0;
  const balanceDue = Math.max((invoice?.total || 0) - paidTotal, 0);

  function formatDate(value?: string) {
    if (!value) return "-";
    return value.slice(0, 10);
  }

  function formatCurrency(value: number) {
    return value.toLocaleString(undefined, { style: "currency", currency: "USD" });
  }

  async function load() {
    const [inv, files, settingsData] = await Promise.all([
      apiGet(`/invoices/${id}`),
      apiGet("/attachments", { entity_type: "invoice", entity_id: id }),
      apiGet("/settings"),
    ]);
    setInvoice(inv);
    const rate = inv.subtotal ? (inv.tax / inv.subtotal) * 100 : 0;
    setTaxRate(Number(rate.toFixed(2)));
    setInvoiceDate(inv.issued_at ? String(inv.issued_at).slice(0, 10) : "");
    setDueDate(inv.due_date ? String(inv.due_date).slice(0, 10) : "");
    setAttachments(files || []);
    setSettings(settingsData);
    if (inv?.customer_id) {
      const customerData = await apiGet(`/customers/${inv.customer_id}`);
      setCustomerName(customerData?.name || "");
      setCustomer(customerData);
    }
    if (inv?.job_id) {
      const jobData = await apiGet(`/jobs/${inv.job_id}`);
      setJob(jobData);
      if (jobData?.estimate_id) {
        const estimateData = await apiGet(`/estimates/${jobData.estimate_id}`);
        setEstimate(estimateData);
        setLineItems(estimateData?.line_items || []);
      } else {
        setEstimate(null);
        setLineItems([]);
      }
    }
  }

  useEffect(() => {
    if (id) load();
  }, [id]);

  async function save() {
    if (!invoice) return;
    setSaveStatus("saving");
    try {
      const updated = await apiPut(`/invoices/${id}`, {
        ...invoice,
        issued_at: invoiceDate ? `${invoiceDate}T00:00:00` : null,
        due_date: dueDate ? `${dueDate}T00:00:00` : null,
      });
      setInvoice(updated);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1500);
    } catch (error) {
      setSaveStatus("error");
    }
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

  async function downloadPdf() {
    if (!pdfRef.current || !invoice) return;
    const [{ default: html2canvas }, jsPdfModule] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);
    const jsPDF = jsPdfModule.jsPDF || (jsPdfModule as any).default;
    const filename = customerName
      ? `${customerName.replace(/\\s+/g, "-").toLowerCase()}-invoice-${invoice.id}.pdf`
      : `invoice-${invoice.id}.pdf`;
    const source = pdfRef.current;
    const clone = source.cloneNode(true) as HTMLDivElement;
    clone.style.position = "fixed";
    clone.style.left = "0";
    clone.style.top = "0";
    clone.style.zIndex = "9999";
    clone.style.background = "#ffffff";
    clone.style.opacity = "1";
    clone.style.pointerEvents = "none";
    document.body.appendChild(clone);

    await new Promise((resolve) => setTimeout(resolve, 50));

    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      scrollX: 0,
      scrollY: 0,
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(filename);

    document.body.removeChild(clone);
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
          <h2 className="page-title">
            {customerName ? `${customerName} Invoice #${invoice.id}` : `Invoice #${invoice.id}`}
          </h2>
          <p className="page-subtitle">Track payments and balances.</p>
        </div>
        <div className="table-actions">
          <button className="btn btn-secondary" onClick={downloadPdf}>
            Download PDF
          </button>
        <button className="btn btn-primary" onClick={save} disabled={saveStatus === "saving"}>
          {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : "Save Changes"}
        </button>
        </div>
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
              <label className="label">Invoice date</label>
              <input
                className="input"
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </div>
            <div className="field">
              <label className="label">Due date</label>
              <input
                className="input"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
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

      <div className="pdf-capture" ref={pdfRef}>
        <div className="pdf-header">
          <div className="pdf-brand">
            {settings?.company_logo_url ? (
              <img
                className="pdf-logo"
                src={settings.company_logo_url}
                alt={settings.company_name || "Company logo"}
              />
            ) : (
              <div className="pdf-logo-placeholder" />
            )}
            <div>
              <div className="pdf-company-name">{settings?.company_name || "Tree Service"}</div>
              <div className="pdf-company-subtitle">Professional tree care</div>
            </div>
          </div>
          <div className="pdf-title">
            <div>Invoice</div>
            <div className="pdf-meta">#{invoice.id}</div>
            <div className="pdf-meta">Date: {formatDate(invoiceDate)}</div>
            <div className="pdf-meta">Due: {formatDate(dueDate)}</div>
          </div>
        </div>

        <div className="pdf-section">
          <div className="pdf-grid">
            <div>
              <div className="pdf-label">Bill to</div>
              <div className="pdf-strong">{customerName || "Customer"}</div>
              <div className="pdf-muted">{invoice.service_address || customer?.service_address || ""}</div>
              <div className="pdf-muted">{customer?.email || ""}</div>
            </div>
            <div>
              <div className="pdf-label">Job</div>
              <div className="pdf-strong">Job #{invoice.job_id}</div>
              <div className="pdf-muted">{job?.scheduled_start ? formatDate(job.scheduled_start) : ""}</div>
            </div>
          </div>
        </div>

        <table className="pdf-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
              <th>Unit price</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {(lineItems.length ? lineItems : [{ name: "Service", qty: 1, unit_price: invoice.subtotal, total: invoice.subtotal }]).map(
              (item: any, idx: number) => (
                <tr key={`${item.name}-${idx}`}>
                  <td>
                    <div className="pdf-strong">{item.name}</div>
                    {item.description ? <div className="pdf-muted">{item.description}</div> : null}
                  </td>
                  <td>{item.qty}</td>
                  <td>{formatCurrency(item.unit_price || 0)}</td>
                  <td>{formatCurrency(item.total ?? item.qty * item.unit_price)}</td>
                </tr>
              ),
            )}
          </tbody>
        </table>

        <div className="pdf-summary">
          <div className="pdf-summary-row">
            <span>Subtotal</span>
            <span>{formatCurrency(invoice.subtotal || 0)}</span>
          </div>
          <div className="pdf-summary-row">
            <span>Tax</span>
            <span>{formatCurrency(invoice.tax || 0)}</span>
          </div>
          <div className="pdf-summary-row pdf-total">
            <span>Total</span>
            <span>{formatCurrency(invoice.total || 0)}</span>
          </div>
          <div className="pdf-summary-row">
            <span>Paid</span>
            <span>{formatCurrency(paidTotal)}</span>
          </div>
          <div className="pdf-balance">Balance due {formatCurrency(balanceDue)}</div>
        </div>

        {invoice.notes ? (
          <div className="pdf-notes">
            <div className="pdf-label">Notes</div>
            <div className="pdf-muted">{invoice.notes}</div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
