export default function Home() {
  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">Arborist operations suite</p>
          <h1 className="hero-title">Arbor AI</h1>
          <p className="hero-lede">
            Run a modern tree service business with AI assisted workflows for lead
            capture, estimating, and crew scheduling.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="/leads">Capture a lead</a>
            <a className="btn btn-secondary" href="/estimates">Build an estimate</a>
          </div>
          <div className="hero-tags">
            <span className="tag">Tree risk notes</span>
            <span className="tag">Scope and hazards</span>
            <span className="tag">Crew ready plans</span>
          </div>
        </div>
        <div className="hero-card">
          <h3>Workflow at a glance</h3>
          <ol className="timeline">
            <li>
              <span className="step">1</span>
              <div>Log incoming leads with property details and notes.</div>
            </li>
            <li>
              <span className="step">2</span>
              <div>Generate scope, hazards, and pricing suggestions.</div>
            </li>
            <li>
              <span className="step">3</span>
              <div>Schedule crews with AI suggestions and availability.</div>
            </li>
            <li>
              <span className="step">4</span>
              <div>Issue invoices and keep job status visible.</div>
            </li>
          </ol>
        </div>
      </section>

      <section className="feature-grid">
        <div className="feature-card">
          <h4>Polished estimates</h4>
          <p>Turn field notes into clear scope, hazards, and equipment lists.</p>
        </div>
        <div className="feature-card">
          <h4>Operational clarity</h4>
          <p>Keep crews aligned with the latest schedule and customer updates.</p>
        </div>
        <div className="feature-card">
          <h4>Billing confidence</h4>
          <p>Track job completion and invoice status in one place.</p>
        </div>
      </section>

      <section className="card section">
        <div className="card-header">
          <div>
            <div className="card-title">Built for arborist crews</div>
            <p className="card-subtitle">
              Manage lead intake, estimate approvals, and crew schedules without
              leaving your operations hub.
            </p>
          </div>
          <span className="badge">Tree care focus</span>
        </div>
        <div className="panel-grid">
          <div className="panel">
            <div className="list-title">AI field summaries</div>
            <p className="list-meta">
              Organize inspection notes, hazards, and equipment needs.
            </p>
          </div>
          <div className="panel">
            <div className="list-title">Season ready planning</div>
            <p className="list-meta">
              Balance crews, equipment, and storm response priorities.
            </p>
          </div>
          <div className="panel">
            <div className="list-title">Customer confidence</div>
            <p className="list-meta">
              Share professional scope and pricing details every time.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
