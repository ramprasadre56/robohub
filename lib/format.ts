export function timeAgo(ms: number, now = Date.now()) {
  const s = Math.max(1, Math.floor((now - ms) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60); if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h`;
  const d = new Date(ms);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", ...(d.getFullYear() !== new Date(now).getFullYear() ? { year: "numeric" } : {}) });
}
export const fullTime = (ms: number) =>
  new Date(ms).toLocaleString("en-IN", { hour: "numeric", minute: "2-digit", day: "numeric", month: "short", year: "numeric" });
export const compact = (n: number) => (n < 1000 ? String(n) : n < 1e6 ? `${+(n / 1000).toFixed(1)}K` : `${+(n / 1e6).toFixed(1)}M`);

export async function api<T = unknown>(url: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(url, {
    method: init?.method ?? (init?.body !== undefined ? "POST" : "GET"),
    headers: init?.body !== undefined ? { "content-type": "application/json" } : undefined,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Request failed (${res.status})`);
  return data as T;
}
