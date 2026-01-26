// lib/api.ts
const RAW_API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';
const API_BASE = RAW_API_BASE.replace(/\/+$/, '');
export const api = (path: string) => {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  // In production, prefix with /api for Next.js rewrite
  const pathWithPrefix = API_BASE ? normalizedPath : `/api${normalizedPath}`;
  return API_BASE ? `${API_BASE}${pathWithPrefix}` : pathWithPrefix;
};

export async function postJSON<T>(
  url: string,
  body: unknown,
  options?: { headers?: Record<string, string> }
): Promise<T> {
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const msg = await r.text().catch(() => '');
    throw new Error(msg || `HTTP ${r.status}`);
  }
  return r.json() as Promise<T>;
}

export async function putJSON<T>(
  url: string,
  body: unknown,
  options?: { headers?: Record<string, string> }
): Promise<T> {
  const r = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const msg = await r.text().catch(() => '');
    throw new Error(msg || `HTTP ${r.status}`);
  }
  return r.json() as Promise<T>;
}
