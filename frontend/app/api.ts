const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

function buildUrl(path: string, params?: Record<string, string | number | undefined>) {
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

export async function apiGet(path: string, params?: Record<string, string | number | undefined>) {
  const res = await fetch(buildUrl(path, params), { cache: "no-store" });
  return res.json();
}

export async function apiPost(path: string, body: any) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function apiPut(path: string, body: any) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function apiDelete(path: string) {
  const res = await fetch(`${API_BASE}${path}`, { method: "DELETE" });
  return res.json();
}
