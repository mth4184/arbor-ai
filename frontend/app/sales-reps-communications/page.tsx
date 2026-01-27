"use client";

export default function SalesRepsCommunicationsPage() {
  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Sales reps</p>
          <h2 className="page-title">Sales communication hub</h2>
          <p className="page-subtitle">
            Share pipeline updates, estimate handoffs, and follow-up priorities.
          </p>
        </div>
        <button className="btn btn-primary">New sales update</button>
      </header>

      <section className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Sales communications</div>
            <p className="card-subtitle">Professional templates for sales coordination.</p>
          </div>
          <span className="badge">Sales</span>
        </div>
        <div className="list">
          <div className="list-item">
            <div>
              <div className="list-title">Pipeline status update</div>
              <div className="list-meta">Summarize top opportunities and next steps.</div>
            </div>
            <button className="btn btn-secondary">Draft</button>
          </div>
          <div className="list-item">
            <div>
              <div className="list-title">Estimate handoff note</div>
              <div className="list-meta">Detail scope, pricing, and customer expectations.</div>
            </div>
            <button className="btn btn-secondary">Draft</button>
          </div>
          <div className="list-item">
            <div>
              <div className="list-title">Follow-up priority list</div>
              <div className="list-meta">Flag urgent callbacks and proposal reminders.</div>
            </div>
            <button className="btn btn-secondary">Draft</button>
          </div>
        </div>
      </section>
    </main>
  );
}
