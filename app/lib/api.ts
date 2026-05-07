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
    const text = await r.text().catch(() => '');
    // 尝试解析 JSON 格式的错误响应
    try {
      const json = JSON.parse(text);
      throw new Error(json.detail || json.message || text || `HTTP ${r.status}`);
    } catch {
      throw new Error(text || `HTTP ${r.status}`);
    }
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

// ============================================
// Quota / simulate payment helpers
// ============================================

export type QuotaItem = {
  quota_type: string;
  total: number;
  used: number;
  remaining: number;
  is_unlimited: boolean;
};

export type MyQuotas = {
  chat: QuotaItem;
  liuyao_chat: QuotaItem;
};

function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getMyQuotas(): Promise<MyQuotas> {
  const r = await fetch(api('/quota/me/all'), {
    headers: authHeaders(),
    credentials: 'include',
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export type SimulatePaymentResult = {
  order_id: number;
  product_code: string;
  granted: { bazi?: number; liuyao?: number };
  quotas: QuotaItem[];
};

export async function simulatePayment(productCode: string): Promise<SimulatePaymentResult> {
  return postJSON<SimulatePaymentResult>(
    api('/payments/simulate'),
    { product_code: productCode },
    { headers: authHeaders() },
  );
}

/** Format a quota object for header chips. -1 → "无限制". */
export function formatQuotaText(q: { total: number; remaining: number; is_unlimited: boolean }): string {
  if (q.is_unlimited || q.total === -1) return '无限制';
  return `剩余 ${q.remaining} 次`;
}
