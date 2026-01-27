"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiGet } from "./api";
import StatusChip from "./components/StatusChip";

function startOfWeek(date: Date) {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(date);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function dateKey(date: Date) {
  return date.toLocaleDateString("en-CA");
}

function parseDateParam(value: string | null) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stats, setStats] = useState<any>(null);
  const [weeklyJobs, setWeeklyJobs] = useState<any[]>([]);
  const [upcomingJobs, setUpcomingJobs] = useState<any[]>([]);
  const [openEstimates, setOpenEstimates] = useState<any[]>([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [crews, setCrews] = useState<any[]>([]);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const weekParam = searchParams.get("week");

  useEffect(() => {
    const parsed = parseDateParam(weekParam);
    if (!parsed) return;
    const normalized = startOfWeek(parsed);
    if (dateKey(normalized) !== dateKey(weekStart)) {
      setWeekStart(normalized);
    }
  }, [weekParam, weekStart]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const desired = dateKey(weekStart);
    if (params.get("week") !== desired) {
      params.set("week", desired);
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }, [weekStart, searchParams, router]);

  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const isoTomorrow = tomorrow.toISOString();
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    const isoWeekStart = weekStart.toISOString();
    const isoWeekEnd = weekEnd.toISOString();

    async function load() {
      const [
        dashboard,
        weekJobs,
        upcoming,
        draftEstimates,
        sentEstimates,
        unpaid,
        partial,
        customerItems,
        crewItems,
      ] = await Promise.all([
        apiGet("/dashboard"),
        apiGet("/calendar", { start: isoWeekStart, end: isoWeekEnd }),
        apiGet("/jobs", { start: isoTomorrow }),
        apiGet("/estimates", { status: "draft" }),
        apiGet("/estimates", { status: "sent" }),
        apiGet("/invoices", { status: "unpaid" }),
        apiGet("/invoices", { status: "partial" }),
        apiGet("/customers"),
        apiGet("/crews"),
      ]);
      setStats(dashboard || null);
      setWeeklyJobs(Array.isArray(weekJobs) ? weekJobs : []);
      setUpcomingJobs(Array.isArray(upcoming) ? upcoming : []);
      setOpenEstimates([
        ...(Array.isArray(draftEstimates) ? draftEstimates : []),
        ...(Array.isArray(sentEstimates) ? sentEstimates : []),
      ]);
      setUnpaidInvoices([
        ...(Array.isArray(unpaid) ? unpaid : []),
        ...(Array.isArray(partial) ? partial : []),
      ]);
      setCustomers(Array.isArray(customerItems) ? customerItems : []);
      setCrews(Array.isArray(crewItems) ? crewItems : []);
    }

    load();
  }, [weekStart]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, idx) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + idx);
      return day;
    });
  }, [weekStart]);

  function shiftWeek(offset: number) {
    setWeekStart((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + offset * 7);
      return startOfWeek(next);
    });
  }

  const crewGroups = useMemo(() => {
    const ground = crews.filter((crew) => crew.type !== "PHC");
    const phc = crews.filter((crew) => crew.type === "PHC");
    return { ground, phc };
  }, [crews]);

  const jobsByCrewDay = useMemo(() => {
    const map = new Map<string, any[]>();
    weeklyJobs.forEach((job) => {
      if (!job.crew_id || !job.scheduled_start) return;
      const jobDate = new Date(job.scheduled_start);
      if (Number.isNaN(jobDate.getTime())) return;
      const key = `${job.crew_id}-${dateKey(jobDate)}`;
      const list = map.get(key) || [];
      list.push(job);
      map.set(key, list);
    });
    return map;
  }, [weeklyJobs]);

  function renderCrewCalendar(title: string, subtitle: string, crewList: any[]) {
    return (
      <div className="weekly-schedule-group">
        <div className="card-header">
          <div>
            <div className="card-title">{title}</div>
            <p className="card-subtitle">{subtitle}</p>
          </div>
          <span className="badge">{crewList.length} crews</span>
        </div>
        {crewList.length === 0 ? (
          <p className="card-subtitle">No crews available.</p>
        ) : (
          <div className="weekly-calendar-scroll">
            <div className="weekly-calendar">
              <div className="weekly-header">
                <div className="weekly-cell weekly-crew-header">Crew</div>
                {weekDays.map((day) => (
                  <div key={day.toISOString()} className="weekly-cell weekly-day-header">
                    {formatDayLabel(day)}
                  </div>
                ))}
              </div>
              {crewList.map((crew) => (
                <div key={crew.id} className="weekly-row">
                  <div className="weekly-cell weekly-crew-name">{crew.name}</div>
                  {weekDays.map((day) => {
                    const key = `${crew.id}-${dateKey(day)}`;
                    const jobs = jobsByCrewDay.get(key) || [];
                    return (
                      <div key={key} className="weekly-cell weekly-day-cell">
                        {jobs.length === 0 ? (
                          <span className="weekly-empty">—</span>
                        ) : (
                          jobs.map((job) => {
                            const customer = customers.find((item) => item.id === job.customer_id);
                            return (
                              <div key={job.id} className="weekly-job">
                                <div className="weekly-job-title">
                                  {customer?.name || `Customer #${job.customer_id}`}
                                </div>
                                <div className="weekly-job-meta">
                                  {job.service_address || customer?.service_address || "-"}
                                </div>
                                <StatusChip status={job.status} />
                              </div>
                            );
                          })
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

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
            <div className="card-title">Weekly crew schedule</div>
            <p className="card-subtitle">
              Foreman and crew assignments for the current week, split by crew type.
            </p>
          </div>
          <div className="table-actions">
            <button className="btn btn-secondary" onClick={() => shiftWeek(-1)}>
              Previous
            </button>
            <button className="btn btn-secondary" onClick={() => shiftWeek(1)}>
              Next
            </button>
            <span className="badge">Week of {formatDayLabel(weekStart)}</span>
          </div>
        </div>
        <div className="weekly-schedule">
          {renderCrewCalendar("Ground crews", "GTC foreman schedule", crewGroups.ground)}
          {renderCrewCalendar("Plant health care crews", "PHC foreman schedule", crewGroups.phc)}
        </div>
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
            {unpaidInvoices
              .sort((a, b) => {
                const dateA = a.issued_at ? new Date(a.issued_at).getTime() : 0;
                const dateB = b.issued_at ? new Date(b.issued_at).getTime() : 0;
                return dateB - dateA;
              })
              .slice(0, 5)
              .map((invoice) => {
                const customer = customers.find((item) => item.id === invoice.customer_id);
                const customerId = invoice.customer_id || customer?.id;
                return (
                  <li key={invoice.id}>
                    {customerId ? (
                      <Link className="list-item list-item-link" href={`/customers/${customerId}`}>
                        <div>
                          <div className="list-title">{customer?.name || "Client"}</div>
                          <div className="list-meta">
                            {invoice.service_address || customer?.service_address || "-"}
                          </div>
                        </div>
                        <div className="table-actions">
                          <span className="list-meta">
                            {invoice.issued_at ? String(invoice.issued_at).slice(0, 10) : "No date"}
                          </span>
                          <span className="list-meta">${invoice.total} due</span>
                          <StatusChip status={invoice.status} />
                        </div>
                      </Link>
                    ) : (
                      <div className="list-item">
                        <div>
                          <div className="list-title">{customer?.name || "Client"}</div>
                          <div className="list-meta">
                            {invoice.service_address || customer?.service_address || "-"}
                          </div>
                        </div>
                        <div className="table-actions">
                          <span className="list-meta">
                            {invoice.issued_at ? String(invoice.issued_at).slice(0, 10) : "No date"}
                          </span>
                          <span className="list-meta">${invoice.total} due</span>
                          <StatusChip status={invoice.status} />
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
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
