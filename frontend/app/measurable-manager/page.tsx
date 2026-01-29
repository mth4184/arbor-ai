"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import NumberInput from "../components/NumberInput";

type MetricLibraryItem = {
  id: string;
  title: string;
  category: "Revenue" | "Expenses" | "Operations";
  format: "currency" | "number";
  goal: number;
  description: string;
};

const initialLibrary: MetricLibraryItem[] = [
  {
    id: "lib-1",
    title: "Client calls",
    category: "Revenue",
    format: "number",
    goal: 100,
    description: "Weekly inbound leads and outreach volume.",
  },
  {
    id: "lib-2",
    title: "Closed contracts",
    category: "Revenue",
    format: "number",
    goal: 5,
    description: "Jobs won by the sales team.",
  },
  {
    id: "lib-3",
    title: "Total revenue",
    category: "Revenue",
    format: "currency",
    goal: 20000,
    description: "Gross revenue booked in the period.",
  },
  {
    id: "lib-4",
    title: "Labor cost",
    category: "Expenses",
    format: "currency",
    goal: 8000,
    description: "Crew labor spend for the period.",
  },
  {
    id: "lib-5",
    title: "Equipment cost",
    category: "Expenses",
    format: "currency",
    goal: 2500,
    description: "Maintenance and rental spend.",
  },
];

export default function MeasurableManagerPage() {
  const [library, setLibrary] = useState<MetricLibraryItem[]>(initialLibrary);
  const [draft, setDraft] = useState({
    title: "",
    category: "Revenue" as MetricLibraryItem["category"],
    format: "number" as MetricLibraryItem["format"],
    goal: 0,
    description: "",
  });

  const totals = useMemo(() => {
    return {
      total: library.length,
      revenue: library.filter((item) => item.category === "Revenue").length,
      expenses: library.filter((item) => item.category === "Expenses").length,
    };
  }, [library]);

  function updateItem(id: string, patch: Partial<MetricLibraryItem>) {
    setLibrary((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function addItem() {
    if (!draft.title.trim()) return;
    const next: MetricLibraryItem = {
      id: `lib-${Date.now()}`,
      title: draft.title.trim(),
      category: draft.category,
      format: draft.format,
      goal: draft.goal,
      description: draft.description.trim(),
    };
    setLibrary((prev) => [next, ...prev]);
    setDraft({
      title: "",
      category: "Revenue",
      format: "number",
      goal: 0,
      description: "",
    });
  }

  function removeItem(id: string) {
    setLibrary((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Scorecard</p>
          <h2 className="page-title">Measurable Manager</h2>
          <p className="page-subtitle">Maintain the list of measurable templates used across teams.</p>
        </div>
        <div className="table-actions">
          <Link className="btn btn-secondary" href="/finances">
            Back to Scorecard
          </Link>
          <button className="btn btn-primary" onClick={addItem} disabled={!draft.title.trim()}>
            Add measurable
          </button>
        </div>
      </header>

      <section className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Library overview</div>
            <p className="card-subtitle">Edit names, goals, and formats for quick reuse.</p>
          </div>
          <div className="table-actions">
            <span className="badge">{totals.total} measurables</span>
            <span className="badge">{totals.revenue} revenue</span>
            <span className="badge">{totals.expenses} expense</span>
          </div>
        </div>
        <div className="panel-grid">
          {library.map((item) => (
            <div key={item.id} className="panel">
              <div className="card-header">
                <div>
                  <div className="card-title">{item.title || "Untitled measurable"}</div>
                  <p className="card-subtitle">{item.category}</p>
                </div>
                <button className="btn btn-ghost" onClick={() => removeItem(item.id)}>
                  Remove
                </button>
              </div>
              <div className="form-grid">
                <div className="field field-full">
                  <label className="label">Name</label>
                  <input
                    className="input"
                    value={item.title}
                    onChange={(event) => updateItem(item.id, { title: event.target.value })}
                  />
                </div>
                <div className="field">
                  <label className="label">Category</label>
                  <select
                    className="select"
                    value={item.category}
                    onChange={(event) =>
                      updateItem(item.id, { category: event.target.value as MetricLibraryItem["category"] })
                    }
                  >
                    <option value="Revenue">Revenue</option>
                    <option value="Expenses">Expenses</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>
                <div className="field">
                  <label className="label">Format</label>
                  <select
                    className="select"
                    value={item.format}
                    onChange={(event) =>
                      updateItem(item.id, { format: event.target.value as MetricLibraryItem["format"] })
                    }
                  >
                    <option value="number">Number</option>
                    <option value="currency">Currency</option>
                  </select>
                </div>
                <div className="field">
                  <label className="label">Goal</label>
                  <NumberInput
                    className="input"
                    value={item.goal}
                    onValueChange={(value) => updateItem(item.id, { goal: value })}
                    prefix={item.format === "currency" ? "$" : undefined}
                  />
                </div>
                <div className="field field-full">
                  <label className="label">Description</label>
                  <textarea
                    className="textarea"
                    value={item.description}
                    onChange={(event) => updateItem(item.id, { description: event.target.value })}
                    placeholder="Add a short description for this metric."
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card section">
        <div className="card-header">
          <div>
            <div className="card-title">Add a measurable</div>
            <p className="card-subtitle">Build a new template to reuse across scorecards.</p>
          </div>
          <span className="badge">New</span>
        </div>
        <div className="form-grid">
          <div className="field field-full">
            <label className="label">Name</label>
            <input
              className="input"
              value={draft.title}
              onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Crew utilization"
            />
          </div>
          <div className="field">
            <label className="label">Category</label>
            <select
              className="select"
              value={draft.category}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, category: event.target.value as MetricLibraryItem["category"] }))
              }
            >
              <option value="Revenue">Revenue</option>
              <option value="Expenses">Expenses</option>
              <option value="Operations">Operations</option>
            </select>
          </div>
          <div className="field">
            <label className="label">Format</label>
            <select
              className="select"
              value={draft.format}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, format: event.target.value as MetricLibraryItem["format"] }))
              }
            >
              <option value="number">Number</option>
              <option value="currency">Currency</option>
            </select>
          </div>
          <div className="field">
            <label className="label">Goal</label>
            <NumberInput
              className="input"
              value={draft.goal}
              onValueChange={(value) => setDraft((prev) => ({ ...prev, goal: value }))}
              prefix={draft.format === "currency" ? "$" : undefined}
            />
          </div>
          <div className="field field-full">
            <label className="label">Description</label>
            <textarea
              className="textarea"
              value={draft.description}
              onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Describe what success looks like for this metric."
            />
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" onClick={addItem} disabled={!draft.title.trim()}>
              Add measurable
            </button>
            {!draft.title.trim() ? (
              <span className="form-hint">Add a name to enable saving.</span>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
