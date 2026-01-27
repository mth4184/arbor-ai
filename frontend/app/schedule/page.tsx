"use client";

export default function SchedulePage() {
  const calendarUrl = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_EMBED_URL;
  const hasCalendar = Boolean(calendarUrl);

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Schedule</p>
          <h2 className="page-title">Google Calendar</h2>
          <p className="page-subtitle">
            View shared crew schedules directly from Google Calendar.
          </p>
        </div>
        {hasCalendar ? (
          <a className="btn btn-secondary" href={calendarUrl} target="_blank" rel="noreferrer">
            Open in Google Calendar
          </a>
        ) : null}
      </header>

      <section className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Team calendar</div>
            <p className="card-subtitle">Embed your shared Google Calendar here.</p>
          </div>
          <span className="badge">Live</span>
        </div>
        <div className="calendar-embed-shell">
          {hasCalendar ? (
            <iframe
              className="calendar-embed"
              src={calendarUrl}
              title="Google Calendar"
              loading="lazy"
            />
          ) : (
            <div className="calendar-embed-empty">
              Add <strong>NEXT_PUBLIC_GOOGLE_CALENDAR_EMBED_URL</strong> to
              <span className="calendar-embed-code"> frontend/.env.local</span> to show your calendar.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
