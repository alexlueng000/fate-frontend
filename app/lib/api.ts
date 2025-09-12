// lib/api.ts
const RAW_API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';
const API_BASE = RAW_API_BASE.replace(/\/+$/, '');

// 这里改：没有 API_BASE 时，直接用原始 path（不再加 `/api`）
export const api = (path: string) => (API_BASE ? `${API_BASE}${path}` : path);

export async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const msg = await r.text().catch(() => '');
    throw new Error(msg || `HTTP ${r.status}`);
  }
  return r.json() as Promise<T>;
}
