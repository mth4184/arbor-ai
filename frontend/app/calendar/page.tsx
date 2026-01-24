"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiGet } from "../api";
import StatusChip from "../components/StatusChip";

function startOfWeek(date: Date) {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(date);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

export default function CalendarPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, idx) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + idx);
      return day;
    });
  }, [weekStart]);

  useEffect(() => {
    const end = new Date(weekStart);
    end.setDate(weekStart.getDate() + 7);
    apiGet("/calendar", { start: weekStart.toISOString(), end: end.toISOString() }).then(setJobs);
  }, [weekStart]);

  function nextWeek() {
    const next = new Date(weekStart);
    next.setDate(weekStart.getDate() + 7);
    setWeekStart(next);
  }

  function prevWeek() {
    const prev = new Date(weekStart);
    prev.setDate(weekStart.getDate() - 7);
    setWeekStart(prev);
  }

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Calendar</p>
          <h2 className="page-title">Weekly schedule</h2>
          <p className="page-subtitle">View crew assignments across the week.</p>
        </div>
        <div className="table-actions">
          <Link className="btn btn-primary" href="/jobs">
            New Job
          </Link>
          <button className="btn btn-secondary" onClick={prevWeek}>
            Previous
          </button>
          <button className="btn btn-secondary" onClick={nextWeek}>
            Next
          </button>
        </div>
      </header>

      <section className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Week of {weekStart.toDateString()}</div>
            <p className="card-subtitle">Jobs scheduled between crews and customers.</p>
          </div>
          <span className="badge">{jobs.length} jobs</span>
        </div>
        <div className="panel-grid">
          {weekDays.map((day) => {
            const dayKey = day.toDateString();
            const dayJobs = jobs.filter((job) => {
              if (!job.scheduled_start) return false;
              return new Date(job.scheduled_start).toDateString() === dayKey;
            });
            return (
              <div key={dayKey} className="panel">
                <div className="list-title">{day.toLocaleDateString(undefined, { weekday: "long" })}</div>
                <p className="list-meta">{day.toLocaleDateString()}</p>
                {dayJobs.length === 0 ? (
                  <p className="card-subtitle section">No jobs.</p>
                ) : (
                  <ul className="list section">
                    {dayJobs.map((job) => (
                      <li key={job.id} className="list-item">
                        <div>
                          <div className="list-title">Job #{job.id}</div>
                          <div className="list-meta">Crew #{job.crew_id ?? "TBD"}</div>
                        </div>
                        <div className="table-actions">
                          <StatusChip status={job.status} />
                          <Link className="btn btn-secondary" href={`/jobs/${job.id}`}>
                            Open
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
