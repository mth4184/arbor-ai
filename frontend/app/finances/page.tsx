"use client";

import { useMemo, useState } from "react";

type ViewMode = "weekly" | "monthly" | "quarterly" | "annual";

type Metric = {
  id: string;
  title: string;
  goal: number;
  format: "currency" | "number";
  trendEnabled: boolean;
  valuesByView: Record<ViewMode, number[]>;
};

type Group = {
  id: string;
  name: string;
  metrics: Metric[];
};

const viewColumns: Record<ViewMode, number> = {
  weekly: 13,
  monthly: 12,
  quarterly: 4,
  annual: 5,
};

function formatCurrency(value: number) {
  return value.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function formatNumber(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function formatDateLabel(start: Date, end: Date) {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString(undefined, opts)} - ${end.toLocaleDateString(undefined, opts)}`;
}

function buildWeeklyLabels(count: number) {
  const labels: string[] = [];
  const today = new Date();
  const end = new Date(today);
  end.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));
  end.setHours(0, 0, 0, 0);
  for (let i = count - 1; i >= 0; i -= 1) {
    const weekStart = new Date(end);
    weekStart.setDate(end.getDate() - i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    labels.push(formatDateLabel(weekStart, weekEnd));
  }
  return labels;
}

function buildMonthlyLabels(count: number) {
  const labels: string[] = [];
  const start = new Date();
  start.setDate(1);
  for (let i = count - 1; i >= 0; i -= 1) {
    const date = new Date(start);
    date.setMonth(start.getMonth() - i);
    labels.push(date.toLocaleDateString(undefined, { month: "short", year: "numeric" }));
  }
  return labels;
}

function buildQuarterlyLabels(count: number) {
  const labels: string[] = [];
  const now = new Date();
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
  const baseYear = now.getFullYear();
  for (let i = count - 1; i >= 0; i -= 1) {
    const offset = currentQuarter - i;
    let quarter = offset;
    let year = baseYear;
    while (quarter <= 0) {
      quarter += 4;
      year -= 1;
    }
    labels.push(`Q${quarter} ${year}`);
  }
  return labels;
}

function buildAnnualLabels(count: number) {
  const labels: string[] = [];
  const year = new Date().getFullYear();
  for (let i = count - 1; i >= 0; i -= 1) {
    labels.push(String(year - i));
  }
  return labels;
}

function getLabelsForView(view: ViewMode) {
  const count = viewColumns[view];
  if (view === "weekly") return buildWeeklyLabels(count);
  if (view === "monthly") return buildMonthlyLabels(count);
  if (view === "quarterly") return buildQuarterlyLabels(count);
  return buildAnnualLabels(count);
}

function ensureLength(values: number[], length: number) {
  if (values.length === length) return values;
  if (values.length > length) return values.slice(0, length);
  return [...values, ...Array.from({ length: length - values.length }, () => 0)];
}

const initialGroups: Group[] = [
  {
    id: "revenue",
    name: "Revenue Metrics",
    metrics: [
      {
        id: "client-calls",
        title: "Client calls",
        goal: 100,
        format: "number",
        trendEnabled: true,
        valuesByView: {
          weekly: Array.from({ length: 13 }, () => 0),
          monthly: Array.from({ length: 12 }, () => 0),
          quarterly: Array.from({ length: 4 }, () => 0),
          annual: Array.from({ length: 5 }, () => 0),
        },
      },
      {
        id: "closed-contracts",
        title: "Closed contracts",
        goal: 5,
        format: "number",
        trendEnabled: true,
        valuesByView: {
          weekly: Array.from({ length: 13 }, () => 0),
          monthly: Array.from({ length: 12 }, () => 0),
          quarterly: Array.from({ length: 4 }, () => 0),
          annual: Array.from({ length: 5 }, () => 0),
        },
      },
      {
        id: "total-revenue",
        title: "Total revenue",
        goal: 20000,
        format: "currency",
        trendEnabled: true,
        valuesByView: {
          weekly: Array.from({ length: 13 }, () => 0),
          monthly: Array.from({ length: 12 }, () => 0),
          quarterly: Array.from({ length: 4 }, () => 0),
          annual: Array.from({ length: 5 }, () => 0),
        },
      },
    ],
  },
  {
    id: "expenses",
    name: "Expense Metrics",
    metrics: [
      {
        id: "labor-cost",
        title: "Labor cost",
        goal: 8000,
        format: "currency",
        trendEnabled: true,
        valuesByView: {
          weekly: Array.from({ length: 13 }, () => 0),
          monthly: Array.from({ length: 12 }, () => 0),
          quarterly: Array.from({ length: 4 }, () => 0),
          annual: Array.from({ length: 5 }, () => 0),
        },
      },
      {
        id: "equipment-cost",
        title: "Equipment cost",
        goal: 2500,
        format: "currency",
        trendEnabled: true,
        valuesByView: {
          weekly: Array.from({ length: 13 }, () => 0),
          monthly: Array.from({ length: 12 }, () => 0),
          quarterly: Array.from({ length: 4 }, () => 0),
          annual: Array.from({ length: 5 }, () => 0),
        },
      },
      {
        id: "fuel-cost",
        title: "Fuel & travel",
        goal: 1200,
        format: "currency",
        trendEnabled: true,
        valuesByView: {
          weekly: Array.from({ length: 13 }, () => 0),
          monthly: Array.from({ length: 12 }, () => 0),
          quarterly: Array.from({ length: 4 }, () => 0),
          annual: Array.from({ length: 5 }, () => 0),
        },
      },
    ],
  },
];

export default function FinancesPage() {
  const [view, setView] = useState<ViewMode>("weekly");
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [team, setTeam] = useState("Operations");
  const [range, setRange] = useState("Last 13 weeks");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const labels = useMemo(() => getLabelsForView(view), [view]);

  function updateMetricValue(groupId: string, metricId: string, idx: number, value: number) {
    setGroups((prev) =>
      prev.map((group) => {
        if (group.id !== groupId) return group;
        return {
          ...group,
          metrics: group.metrics.map((metric) => {
            if (metric.id !== metricId) return metric;
            const updated = {
              ...metric,
              valuesByView: {
                ...metric.valuesByView,
                [view]: ensureLength(metric.valuesByView[view] || [], labels.length).map((item, index) =>
                  index === idx ? value : item,
                ),
              },
            };
            return updated;
          }),
        };
      }),
    );
  }

  function addMetric(groupId: string) {
    const id = `metric-${Date.now()}`;
    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? {
              ...group,
              metrics: [
                ...group.metrics,
                {
                  id,
                  title: "New metric",
                  goal: 0,
                  format: "number",
                  trendEnabled: false,
                  valuesByView: {
                    weekly: Array.from({ length: 13 }, () => 0),
                    monthly: Array.from({ length: 12 }, () => 0),
                    quarterly: Array.from({ length: 4 }, () => 0),
                    annual: Array.from({ length: 5 }, () => 0),
                  },
                },
              ],
            }
          : group,
      ),
    );
  }

  function addGroup() {
    const id = `group-${Date.now()}`;
    setGroups((prev) => [
      ...prev,
      {
        id,
        name: "New Group",
        metrics: [],
      },
    ]);
  }

  function formatMetricValue(metric: Metric, value: number) {
    return metric.format === "currency" ? formatCurrency(value) : formatNumber(value);
  }

  function average(values: number[]) {
    if (!values.length) return 0;
    return values.reduce((sum, item) => sum + item, 0) / values.length;
  }

  function total(values: number[]) {
    return values.reduce((sum, item) => sum + item, 0);
  }

  function valueClass(value: number, goal: number) {
    if (!goal) return "scorecell";
    return value >= goal ? "scorecell scorecell-good" : "scorecell scorecell-low";
  }

  const filteredGroups = useMemo(() => {
    if (!search) return groups;
    return groups.map((group) => ({
      ...group,
      metrics: group.metrics.filter((metric) => metric.title.toLowerCase().includes(search.toLowerCase())),
    }));
  }, [groups, search]);

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Finances</p>
          <h2 className="page-title">Scorecard</h2>
          <p className="page-subtitle">Record and evaluate key metrics for revenue and expenses.</p>
        </div>
        <button className="btn btn-primary">Create</button>
      </header>

      <div className="scorecard-tabs">
        {(["weekly", "monthly", "quarterly", "annual"] as ViewMode[]).map((tab) => (
          <button
            key={tab}
            className={`tab-pill ${view === tab ? "active" : ""}`}
            onClick={() => setView(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <section className="card section">
        <div className="scorecard-filters">
          <select className="select" value={team} onChange={(e) => setTeam(e.target.value)}>
            <option value="Operations">Team: Operations</option>
            <option value="Sales">Team: Sales</option>
            <option value="Service">Team: Service</option>
          </select>
          <select className="select" value={view} onChange={(e) => setView(e.target.value as ViewMode)}>
            <option value="weekly">View by: Week</option>
            <option value="monthly">View by: Month</option>
            <option value="quarterly">View by: Quarter</option>
            <option value="annual">View by: Year</option>
          </select>
          <select className="select" value={range} onChange={(e) => setRange(e.target.value)}>
            <option>Last 13 weeks</option>
            <option>Last 12 months</option>
            <option>Last 4 quarters</option>
            <option>Last 5 years</option>
          </select>
          <div className="scorecard-toolbar">
            <button className="btn btn-secondary" onClick={addGroup}>
              New group
            </button>
            <button className="btn btn-ghost">Go to Measurable Manager</button>
            <div className="scorecard-menu">
              <button className="btn btn-ghost" onClick={() => setMenuOpen(menuOpen ? null : "menu")}>
                ⋯
              </button>
              {menuOpen && (
                <div className="scorecard-menu-panel">
                  <button className="menu-item">Settings</button>
                  <button className="menu-item">Edit group order</button>
                  <button className="menu-item">Merge all groups</button>
                  <button className="menu-item">Export as CSV</button>
                  <button className="menu-item">Print PDF</button>
                </div>
              )}
            </div>
            <input
              className="input scorecard-search"
              placeholder="Search KPIs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {filteredGroups.map((group) => (
          <div key={group.id} className="scorecard-group">
            <div className="scorecard-group-header">
              <div className="scorecard-group-title">
                {group.name} <span className="scorecard-count">{group.metrics.length}</span>
              </div>
              <div className="scorecard-group-actions">
                <div className="scorecard-group-views">
                  {(["weekly", "monthly", "quarterly", "annual"] as ViewMode[]).map((tab) => (
                    <button
                      key={tab}
                      className={`tab-pill tab-pill-small ${view === tab ? "active" : ""}`}
                      onClick={() => setView(tab)}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
                <button className="btn btn-secondary" onClick={() => addMetric(group.id)}>
                  New measurable
                </button>
              </div>
            </div>
            <div className="scorecard-table-wrapper">
              <table className="scorecard-table">
                <thead>
                  <tr>
                    <th className="scorecard-col-trend">View</th>
                    <th className="scorecard-col-title">Title</th>
                    <th className="scorecard-col-goal">Goal</th>
                    <th className="scorecard-col-avg">Average</th>
                    <th className="scorecard-col-total">Total</th>
                    {labels.map((label) => (
                      <th key={label} className="scorecard-col-period">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {group.metrics.map((metric) => {
                    const values = ensureLength(metric.valuesByView[view] || [], labels.length);
                    return (
                      <tr key={metric.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={metric.trendEnabled}
                            onChange={() => {
                              setGroups((prev) =>
                                prev.map((g) =>
                                  g.id === group.id
                                    ? {
                                        ...g,
                                        metrics: g.metrics.map((m) =>
                                          m.id === metric.id
                                            ? { ...m, trendEnabled: !m.trendEnabled }
                                            : m,
                                        ),
                                      }
                                    : g,
                                ),
                              );
                            }}
                          />
                        </td>
                        <td>{metric.title}</td>
                        <td>{metric.goal ? formatMetricValue(metric, metric.goal) : "-"}</td>
                        <td>{formatMetricValue(metric, average(values))}</td>
                        <td>{formatMetricValue(metric, total(values))}</td>
                        {values.map((value, idx) => {
                          const displayValue = value === 0 ? "" : value;
                          return (
                            <td key={`${metric.id}-${idx}`} className={valueClass(value, metric.goal)}>
                              <input
                                className="scorecell-input"
                                type="number"
                                value={displayValue}
                                onChange={(e) => {
                                  const nextValue = e.target.value;
                                  updateMetricValue(
                                    group.id,
                                    metric.id,
                                    idx,
                                    nextValue === "" ? 0 : Number(nextValue),
                                  );
                                }}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
