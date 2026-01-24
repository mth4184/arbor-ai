"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost, apiPut } from "../api";
import NumberInput from "../components/NumberInput";
import SaveButton from "../components/SaveButton";

const emptyUser = {
  name: "",
  email: "",
  role: "office",
  password: "",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<any | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [userForm, setUserForm] = useState(emptyUser);
  const [userError, setUserError] = useState<string | null>(null);
  const [taxRatePercent, setTaxRatePercent] = useState(0);

  async function load() {
    const data = await apiGet("/settings");
    setSettings(data);
    const defaultRate = data?.default_tax_rate ?? 0;
    const percentRate = defaultRate <= 1 ? defaultRate * 100 : defaultRate;
    setTaxRatePercent(Number(percentRate.toFixed(2)));
    const userList = await apiGet("/users");
    if (Array.isArray(userList)) {
      setUsers(userList);
      setUserError(null);
    } else {
      setUserError("User management requires admin authentication.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function saveSettings() {
    if (!settings) return;
    const updated = await apiPut("/settings", {
      ...settings,
      default_tax_rate: Number((taxRatePercent / 100).toFixed(4)),
    });
    setSettings(updated);
  }

  async function createUser() {
    if (!userForm.name.trim() || !userForm.email.trim() || !userForm.password.trim()) return;
    const created = await apiPost("/users", userForm);
    setUsers([created, ...users]);
    setUserForm(emptyUser);
  }

  if (!settings) {
    return (
      <main className="page">
        <p className="card-subtitle">Loading settings...</p>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Settings</p>
          <h2 className="page-title">Company settings</h2>
          <p className="page-subtitle">Configure defaults and manage users.</p>
        </div>
        <SaveButton className="btn btn-primary" onSave={saveSettings} defaultLabel="Save Settings" />
      </header>

      <div className="page-grid">
        <section className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Company profile</div>
              <p className="card-subtitle">Name, logo, and tax defaults.</p>
            </div>
            <span className="badge">Admin</span>
          </div>
          <div className="form-grid">
            <div className="field">
              <label className="label">Company name</label>
              <input
                className="input"
                value={settings.company_name}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
              />
            </div>
            <div className="field">
              <label className="label">Logo URL</label>
              <input
                className="input"
                value={settings.company_logo_url}
                onChange={(e) => setSettings({ ...settings, company_logo_url: e.target.value })}
              />
            </div>
            <div className="field">
              <label className="label">Default tax rate</label>
              <NumberInput
                className="input"
                value={taxRatePercent}
                onValueChange={setTaxRatePercent}
                suffix="%"
              />
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <div>
              <div className="card-title">User management</div>
              <p className="card-subtitle">Admin-only user setup.</p>
            </div>
            <span className="badge">Roles</span>
          </div>
          {userError ? (
            <p className="card-subtitle">{userError}</p>
          ) : (
            <>
              <div className="form-grid">
                <div className="field">
                  <label className="label">Name</label>
                  <input
                    className="input"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label className="label">Email</label>
                  <input
                    className="input"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label className="label">Role</label>
                  <select
                    className="select"
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  >
                    <option value="admin">Admin</option>
                    <option value="office">Office</option>
                    <option value="crew">Crew</option>
                  </select>
                </div>
                <div className="field">
                  <label className="label">Password</label>
                  <input
                    className="input"
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  />
                </div>
                <div className="form-actions">
                  <button className="btn btn-secondary" onClick={createUser}>
                    Add User
                  </button>
                </div>
              </div>
              <ul className="list section">
                {users.map((user) => (
                  <li key={user.id} className="list-item">
                    <div>
                      <div className="list-title">{user.name}</div>
                      <div className="list-meta">{user.email}</div>
                    </div>
                    <span className="badge">{user.role}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
