"use client";

export default function PhcPage() {
  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">PHC</p>
          <h2 className="page-title">Plant health care updates</h2>
          <p className="page-subtitle">
            Coordinate treatment schedules, risk alerts, and seasonal check-ins.
          </p>
        </div>
        <button className="btn btn-primary">New PHC update</button>
      </header>

      <section className="card">
        <div className="card-header">
          <div>
            <div className="card-title">PHC communications</div>
            <p className="card-subtitle">Templates and quick actions for PHC teams.</p>
          </div>
          <span className="badge">PHC</span>
        </div>
        <div className="list">
          <div className="list-item">
            <div>
              <div className="list-title">Treatment plan briefing</div>
              <div className="list-meta">Confirm materials, timing, and site notes.</div>
            </div>
            <button className="btn btn-secondary">Draft</button>
          </div>
          <div className="list-item">
            <div>
              <div className="list-title">Seasonal follow-up</div>
              <div className="list-meta">Share inspection notes and next steps.</div>
            </div>
            <button className="btn btn-secondary">Draft</button>
          </div>
          <div className="list-item">
            <div>
              <div className="list-title">Risk alert</div>
              <div className="list-meta">Highlight urgent issues or safety concerns.</div>
            </div>
            <button className="btn btn-secondary">Draft</button>
          </div>
        </div>
      </section>
    </main>
  );
}
