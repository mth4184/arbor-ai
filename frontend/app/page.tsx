"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "./api";
import StatusChip from "./components/StatusChip";

export default function Home() {
  const [stats, setStats] = useState<any>(null);
  const [todaysJobs, setTodaysJobs] = useState<any[]>([]);
  const [upcomingJobs, setUpcomingJobs] = useState<any[]>([]);
  const [openEstimates, setOpenEstimates] = useState<any[]>([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState<any[]>([]);

  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const isoToday = today.toISOString();
    const isoTomorrow = tomorrow.toISOString();

    async function load() {
      const [dashboard, todayJobs, upcoming, draftEstimates, sentEstimates, unpaid, partial] =
        await Promise.all([
          apiGet("/dashboard"),
          apiGet("/jobs", { start: isoToday, end: isoTomorrow }),
          apiGet("/jobs", { start: isoTomorrow }),
          apiGet("/estimates", { status: "draft" }),
          apiGet("/estimates", { status: "sent" }),
          apiGet("/invoices", { status: "unpaid" }),
          apiGet("/invoices", { status: "partial" }),
        ]);
      setStats(dashboard || null);
      setTodaysJobs(Array.isArray(todayJobs) ? todayJobs : []);
      setUpcomingJobs(Array.isArray(upcoming) ? upcoming : []);
      setOpenEstimates([
        ...(Array.isArray(draftEstimates) ? draftEstimates : []),
        ...(Array.isArray(sentEstimates) ? sentEstimates : []),
      ]);
      setUnpaidInvoices([
        ...(Array.isArray(unpaid) ? unpaid : []),
        ...(Array.isArray(partial) ? partial : []),
      ]);
    }

    load();
  }, []);

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h2 className="page-title">Operations snapshot</h2>
          <p className="page-subtitle">
            Track today’s jobs, open estimates, and billing progress across your crews.
          </p>
        </div>
        <div className="table-actions">
          <Link className="btn btn-primary" href="/estimates">
            New Estimate
          </Link>
          <Link className="btn btn-secondary" href="/jobs">
            Schedule Job
          </Link>
        </div>
      </header>

      <section className="card-grid">
        <div className="stat-card">
          <div className="eyebrow">Today</div>
          <div className="stat-value">{stats?.todays_jobs ?? 0}</div>
          <p className="card-subtitle">Jobs scheduled today</p>
        </div>
        <div className="stat-card">
          <div className="eyebrow">Upcoming</div>
          <div className="stat-value">{stats?.upcoming_jobs ?? 0}</div>
          <p className="card-subtitle">Jobs in the pipeline</p>
        </div>
        <div className="stat-card">
          <div className="eyebrow">Revenue</div>
          <div className="stat-value">${stats?.month_revenue?.toFixed?.(0) ?? 0}</div>
          <p className="card-subtitle">Month to date</p>
        </div>
        <div className="stat-card">
          <div className="eyebrow">Jobs done</div>
          <div className="stat-value">{stats?.jobs_completed ?? 0}</div>
          <p className="card-subtitle">Completed this month</p>
        </div>
      </section>

      <section className="card section">
        <div className="card-header">
          <div>
            <div className="card-title">Today’s jobs</div>
            <p className="card-subtitle">Crews and job status for the day.</p>
          </div>
          <span className="badge">{todaysJobs.length} jobs</span>
        </div>
        {todaysJobs.length === 0 ? (
          <p className="card-subtitle">No jobs scheduled today.</p>
        ) : (
          <ul className="list">
            {todaysJobs.map((job) => (
              <li className="list-item" key={job.id}>
                <div>
                  <div className="list-title">Job #{job.id}</div>
                  <div className="list-meta">Customer #{job.customer_id}</div>
                </div>
                <StatusChip status={job.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card section">
        <div className="card-header">
          <div>
            <div className="card-title">Open estimates</div>
            <p className="card-subtitle">Draft and sent proposals awaiting approval.</p>
          </div>
          <span className="badge">{openEstimates.length} open</span>
        </div>
        {openEstimates.length === 0 ? (
          <p className="card-subtitle">No open estimates.</p>
        ) : (
          <ul className="list">
            {openEstimates.slice(0, 5).map((estimate) => (
              <li className="list-item" key={estimate.id}>
                <div>
                  <div className="list-title">Estimate #{estimate.id}</div>
                  <div className="list-meta">Customer #{estimate.customer_id}</div>
                </div>
                <StatusChip status={estimate.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card section">
        <div className="card-header">
          <div>
            <div className="card-title">Unpaid invoices</div>
            <p className="card-subtitle">Track balances and follow up.</p>
          </div>
          <span className="badge">{unpaidInvoices.length} unpaid</span>
        </div>
        {unpaidInvoices.length === 0 ? (
          <p className="card-subtitle">All invoices are paid.</p>
        ) : (
          <ul className="list">
            {unpaidInvoices.slice(0, 5).map((invoice) => (
              <li className="list-item" key={invoice.id}>
                <div>
                  <div className="list-title">Invoice #{invoice.id}</div>
                  <div className="list-meta">${invoice.total} due</div>
                </div>
                <StatusChip status={invoice.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card section">
        <div className="card-header">
          <div>
            <div className="card-title">Upcoming jobs</div>
            <p className="card-subtitle">Work scheduled for the coming days.</p>
          </div>
          <span className="badge">{upcomingJobs.length} upcoming</span>
        </div>
        {upcomingJobs.length === 0 ? (
          <p className="card-subtitle">No upcoming jobs scheduled.</p>
        ) : (
          <ul className="list">
            {upcomingJobs.slice(0, 5).map((job) => (
              <li className="list-item" key={job.id}>
                <div>
                  <div className="list-title">Job #{job.id}</div>
                  <div className="list-meta">Customer #{job.customer_id}</div>
                </div>
                <StatusChip status={job.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
