"use client";

const DEPARTMENTS = [
  {
    id: "operations",
    name: "Operations",
    owner: "Dispatch + Scheduling",
    channels: ["Daily brief", "Crew notes", "Incident log"],
  },
  {
    id: "sales",
    name: "Sales",
    owner: "Sales leadership",
    channels: ["Pipeline review", "Estimate handoff", "Follow-up updates"],
  },
  {
    id: "finance",
    name: "Finance",
    owner: "Billing + AR",
    channels: ["Invoice status", "Collections", "Payroll updates"],
  },
  {
    id: "phc",
    name: "Plant Health Care",
    owner: "PHC foreman",
    channels: ["Treatment plans", "Seasonal check-ins", "Risk alerts"],
  },
  {
    id: "gtc",
    name: "Ground Crew",
    owner: "Field supervisor",
    channels: ["Job hazards", "Site access", "Equipment needs"],
  },
];

export default function InternalCommunicationsPage() {
  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Internal</p>
          <h2 className="page-title">Internal communications</h2>
          <p className="page-subtitle">
            Coordinate messages across departments with consistent, professional updates.
          </p>
        </div>
        <button className="btn btn-primary">New announcement</button>
      </header>

      <section className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Department channels</div>
            <p className="card-subtitle">Choose a team and send a structured update.</p>
          </div>
          <span className="badge">{DEPARTMENTS.length} departments</span>
        </div>
        <div className="panel-grid">
          {DEPARTMENTS.map((dept) => (
            <div key={dept.id} className="panel">
              <div className="card-header">
                <div>
                  <div className="card-title">{dept.name}</div>
                  <p className="card-subtitle">{dept.owner}</p>
                </div>
              </div>
              <ul className="list section">
                {dept.channels.map((channel) => (
                  <li key={channel} className="list-item">
                    <div className="list-title">{channel}</div>
                    <span className="chip chip-blue">Template</span>
                  </li>
                ))}
              </ul>
              <div className="form-actions">
                <button className="btn btn-secondary">Draft message</button>
                <button className="btn btn-ghost">View history</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card section">
        <div className="card-header">
          <div>
            <div className="card-title">Suggested professional templates</div>
            <p className="card-subtitle">Reusable language for recurring updates.</p>
          </div>
          <span className="badge">Quick start</span>
        </div>
        <div className="list">
          <div className="list-item">
            <div>
              <div className="list-title">Morning dispatch brief</div>
              <div className="list-meta">
                Summarize crew assignments, site access notes, and safety reminders.
              </div>
            </div>
            <button className="btn btn-secondary">Use</button>
          </div>
          <div className="list-item">
            <div>
              <div className="list-title">Sales handoff note</div>
              <div className="list-meta">
                Outline scope, expectations, and follow-up timing for operations.
              </div>
            </div>
            <button className="btn btn-secondary">Use</button>
          </div>
          <div className="list-item">
            <div>
              <div className="list-title">PHC treatment update</div>
              <div className="list-meta">
                Share treatment status, next steps, and customer guidance.
              </div>
            </div>
            <button className="btn btn-secondary">Use</button>
          </div>
        </div>
      </section>
    </main>
  );
}
