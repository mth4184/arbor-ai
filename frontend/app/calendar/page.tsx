"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiGet, apiPut } from "../api";
import StatusChip from "../components/StatusChip";

function startOfWeek(date: Date) {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(date);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function startOfMonth(date: Date) {
  const start = new Date(date);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return start;
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateTime(date: Date, endOfDay = false) {
  return `${formatLocalDate(date)}T${endOfDay ? "23:59:59" : "00:00:00"}`;
}

function dateKey(value?: string) {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  return "";
}

export default function CalendarPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const [openJobs, setOpenJobs] = useState<any[]>([]);
  const [view, setView] = useState<"week" | "month">("week");
  const [monthOffset, setMonthOffset] = useState(0);
  const [customers, setCustomers] = useState<any[]>([]);
  const [jobTypes, setJobTypes] = useState<any[]>([]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, idx) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + idx);
      return day;
    });
  }, [weekStart]);

  const months = useMemo(() => {
    const start = new Date();
    start.setDate(1);
    return Array.from({ length: 13 }, (_, idx) => {
      const date = new Date(start);
      date.setMonth(start.getMonth() + idx);
      return {
        label: date.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
        value: idx,
        date,
      };
    });
  }, []);

  const selectedMonth = useMemo(() => {
    const base = new Date();
    base.setDate(1);
    base.setMonth(base.getMonth() + monthOffset);
    base.setHours(0, 0, 0, 0);
    return base;
  }, [monthOffset]);

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(selectedMonth));
    return Array.from({ length: 42 }, (_, idx) => {
      const day = new Date(start);
      day.setDate(start.getDate() + idx);
      return day;
    });
  }, [selectedMonth]);

  async function loadOpenJobs() {
    const [scheduled, inProgress] = await Promise.all([
      apiGet("/jobs", { status: "scheduled" }),
      apiGet("/jobs", { status: "in_progress" }),
    ]);
    const openList = [...(Array.isArray(scheduled) ? scheduled : []), ...(Array.isArray(inProgress) ? inProgress : [])];
    setOpenJobs(openList.filter((job) => !job.scheduled_start));
  }

  async function loadReferenceData() {
    const [customerItems, jobTypeItems] = await Promise.all([apiGet("/customers"), apiGet("/job-types")]);
    setCustomers(Array.isArray(customerItems) ? customerItems : []);
    setJobTypes(Array.isArray(jobTypeItems) ? jobTypeItems : []);
  }

  async function loadCalendar(rangeStart: Date, rangeEnd: Date) {
    const calendarJobs = await apiGet("/calendar", {
      start: formatDateTime(rangeStart),
      end: formatDateTime(rangeEnd, true),
    });
    setJobs(Array.isArray(calendarJobs) ? calendarJobs : []);
  }

  useEffect(() => {
    loadReferenceData();
  }, []);

  useEffect(() => {
    function refreshCalendar() {
      if (view === "week") {
        const end = new Date(weekStart);
        end.setDate(weekStart.getDate() + 6);
        loadCalendar(weekStart, end);
      } else {
        const monthStart = startOfMonth(selectedMonth);
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthStart.getMonth() + 1);
        monthEnd.setDate(0);
        loadCalendar(monthStart, monthEnd);
      }
      loadOpenJobs();
    }

    refreshCalendar();

    // Listen for job updates from other pages
    const handleCalendarUpdate = () => {
      setTimeout(() => {
        refreshCalendar();
      }, 100);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("calendarUpdated", handleCalendarUpdate);
      return () => {
        window.removeEventListener("calendarUpdated", handleCalendarUpdate);
      };
    }
  }, [weekStart, view, selectedMonth]);

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

  async function assignJob(jobId: number, date: Date) {
    await apiPut(`/jobs/${jobId}`, { scheduled_start: formatDateTime(date) });
    await loadOpenJobs();
    if (view === "week") {
      const end = new Date(weekStart);
      end.setDate(weekStart.getDate() + 6);
      await loadCalendar(weekStart, end);
    } else {
      const monthStart = startOfMonth(selectedMonth);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthStart.getMonth() + 1);
      monthEnd.setDate(0);
      await loadCalendar(monthStart, monthEnd);
    }
    // Dispatch event to notify dashboard of calendar update
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("calendarUpdated"));
    }
  }

  async function unscheduleJob(jobId: number) {
    await apiPut(`/jobs/${jobId}`, { scheduled_start: null, scheduled_end: null });
    await loadOpenJobs();
    if (view === "week") {
      const end = new Date(weekStart);
      end.setDate(weekStart.getDate() + 7);
      await loadCalendar(weekStart, end);
    } else {
      const monthStart = startOfMonth(selectedMonth);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthStart.getMonth() + 1);
      await loadCalendar(monthStart, monthEnd);
    }
    // Dispatch event to notify dashboard of calendar update
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("calendarUpdated"));
    }
  }

  function setDragData(event: any, jobId: number) {
    event.dataTransfer.setData("text/plain", String(jobId));
    event.dataTransfer.setData("application/x-job-id", String(jobId));
    event.dataTransfer.effectAllowed = "move";
  }

  function getDragJobId(event: any) {
    const text = event.dataTransfer.getData("application/x-job-id") || event.dataTransfer.getData("text/plain");
    const parsed = Number(text);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Calendar</p>
          <h2 className="page-title">Schedule</h2>
          <p className="page-subtitle">Drag jobs onto the calendar to schedule crews.</p>
        </div>
        <div className="table-actions">
          <Link className="btn btn-primary" href="/jobs">
            New Job
          </Link>
          <button
            className={view === "week" ? "btn btn-secondary" : "btn btn-ghost"}
            onClick={() => setView("week")}
          >
            Weekly
          </button>
          <button
            className={view === "month" ? "btn btn-secondary" : "btn btn-ghost"}
            onClick={() => setView("month")}
          >
            Monthly
          </button>
          {view === "week" ? (
            <>
              <button className="btn btn-secondary" onClick={prevWeek}>
                Previous
              </button>
              <button className="btn btn-secondary" onClick={nextWeek}>
                Next
              </button>
            </>
          ) : (
            <select
              className="select"
              value={monthOffset}
              onChange={(e) => setMonthOffset(Number(e.target.value))}
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          )}
        </div>
      </header>

      {view === "week" ? (
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
              const dayKey = formatLocalDate(day);
              const isToday = dayKey === formatLocalDate(new Date());
              const dayJobs = jobs.filter((job) => {
                if (!job.scheduled_start) return false;
                return dateKey(job.scheduled_start) === dayKey;
              });
              return (
                <div
                  key={dayKey}
                  className={`panel calendar-drop calendar-week-panel ${isToday ? "calendar-day-today" : ""}`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    const jobId = getDragJobId(event);
                    if (jobId) assignJob(jobId, day);
                  }}
                >
                  <div className="list-title">{day.toLocaleDateString(undefined, { weekday: "long" })}</div>
                  <p className="list-meta">{day.toLocaleDateString()}</p>
                  {dayJobs.length === 0 ? (
                    <p className="card-subtitle section">No jobs.</p>
                  ) : (
                    <ul className="list section">
                      {dayJobs.map((job) => (
                        <li
                          key={job.id}
                          className="list-item"
                          draggable
                          onDragStart={(event) => setDragData(event, job.id)}
                        >
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
      ) : (
        <section className="card">
          <div className="card-header">
            <div>
              <div className="card-title">{months[monthOffset]?.label}</div>
              <p className="card-subtitle">Monthly schedule overview.</p>
            </div>
            <span className="badge">{jobs.length} jobs</span>
          </div>
          <div className="calendar-grid">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
              <div key={label} className="calendar-day calendar-day-header">
                {label}
              </div>
            ))}
            {monthDays.map((day) => {
              const isCurrentMonth = day.getMonth() === selectedMonth.getMonth();
              const dayKey = formatLocalDate(day);
              const isToday = dayKey === formatLocalDate(new Date());
              const dayJobs = jobs.filter((job) => {
                if (!job.scheduled_start) return false;
                return dateKey(job.scheduled_start) === dayKey;
              });
              return (
                <div
                  key={dayKey}
                  className={`calendar-day calendar-drop ${isCurrentMonth ? "" : "calendar-day-muted"} ${
                    isToday ? "calendar-day-today" : ""
                  }`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    const jobId = getDragJobId(event);
                    if (jobId) assignJob(jobId, day);
                  }}
                >
                  <div className="calendar-day-number">{day.getDate()}</div>
                  {dayJobs.slice(0, 3).map((job) => {
                    const customer = customers.find((item) => item.id === job.customer_id);
                    const jobType = jobTypes.find((type) => type.id === job.job_type_id);
                    return (
                      <div
                        key={job.id}
                        className="calendar-job"
                        draggable
                        onDragStart={(event) => setDragData(event, job.id)}
                      >
                        <div className="calendar-job-main">
                          <div className="calendar-job-title">
                            {customer?.name || `Customer #${job.customer_id}`}
                          </div>
                          <div className="calendar-job-meta">{jobType?.name || "Job type TBD"}</div>
                        </div>
                        <StatusChip status={job.status} />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="card section">
        <div className="card-header">
          <div>
            <div className="card-title">Unscheduled & active jobs</div>
            <p className="card-subtitle">
              Drag a job onto the calendar to assign a date, or drop here to unschedule.
            </p>
          </div>
          <span className="badge">{openJobs.length} jobs</span>
        </div>
        <div
          className="drag-list"
          onDragOver={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onDrop={(event) => {
            event.preventDefault();
            event.stopPropagation();
            const jobId = getDragJobId(event);
            if (jobId) unscheduleJob(jobId);
          }}
        >
          {openJobs.length === 0 ? (
            <p className="card-subtitle">No active jobs to schedule.</p>
          ) : (
            openJobs.map((job) => (
              <div
                key={job.id}
                className="drag-card"
                draggable
                onDragStart={(event) => {
                  setDragData(event, job.id);
                }}
              >
                <div>
                  <div className="list-title">Job #{job.id}</div>
                  <div className="list-meta">{job.service_address || "No address"}</div>
                </div>
                <StatusChip status={job.status} />
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
