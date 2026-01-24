const FALLBACK_BASE = "http://localhost:8000";
const PROXY_BASE = "/proxy";
const USE_PROXY = process.env.NEXT_PUBLIC_USE_PROXY !== "false";

function getDirectBase() {
  const envBase = process.env.NEXT_PUBLIC_API_BASE;
  if (envBase) return envBase;
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }
  return FALLBACK_BASE;
}

function normalizePath(path: string) {
  if (path.startsWith("http")) return path;
  return path.startsWith("/") ? path : `/${path}`;
}

function buildUrl(path: string, params?: Record<string, string | number | undefined>) {
  const normalizedPath = normalizePath(path);
  const base = path.startsWith("http")
    ? path
    : `${USE_PROXY ? PROXY_BASE : getDirectBase()}${normalizedPath}`;
  const url = base.startsWith("http")
    ? new URL(base)
    : new URL(base, typeof window !== "undefined" ? window.location.origin : "http://localhost");
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
  const res = await fetch(buildUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function apiPut(path: string, body: any) {
  const res = await fetch(buildUrl(path), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function apiDelete(path: string) {
  const res = await fetch(buildUrl(path), { method: "DELETE" });
  return res.json();
}
