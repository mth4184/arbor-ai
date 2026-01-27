"use client";

export default function GtcPage() {
  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">GTC</p>
          <h2 className="page-title">Ground crew updates</h2>
          <p className="page-subtitle">
            Coordinate daily briefs, site access, and safety messaging for field crews.
          </p>
        </div>
        <button className="btn btn-primary">New ground crew brief</button>
      </header>

      <section className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Ground crew communications</div>
            <p className="card-subtitle">Reusable messaging for day-to-day operations.</p>
          </div>
          <span className="badge">GTC</span>
        </div>
        <div className="list">
          <div className="list-item">
            <div>
              <div className="list-title">Morning dispatch brief</div>
              <div className="list-meta">Assignments, hazards, and equipment needs.</div>
            </div>
            <button className="btn btn-secondary">Draft</button>
          </div>
          <div className="list-item">
            <div>
              <div className="list-title">Site access notes</div>
              <div className="list-meta">Gate codes, parking instructions, and contacts.</div>
            </div>
            <button className="btn btn-secondary">Draft</button>
          </div>
          <div className="list-item">
            <div>
              <div className="list-title">Safety reminder</div>
              <div className="list-meta">PPE, traffic control, and weather updates.</div>
            </div>
            <button className="btn btn-secondary">Draft</button>
          </div>
        </div>
      </section>
    </main>
  );
}
