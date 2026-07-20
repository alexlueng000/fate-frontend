const RAW_API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';
const API_BASE = RAW_API_BASE.replace(/\/+$/, '');

export const api = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const pathWithPrefix = API_BASE ? normalizedPath : `/api${normalizedPath}`;
  return API_BASE ? `${API_BASE}${pathWithPrefix}` : pathWithPrefix;
};

export function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseError(r: Response): Promise<Error> {
  const text = await r.text().catch(() => '');
  if (!text) return new Error(`HTTP ${r.status}`);
  try {
    const json = JSON.parse(text);
    return new Error(json.detail || json.message || text || `HTTP ${r.status}`);
  } catch {
    return new Error(text || `HTTP ${r.status}`);
  }
}

export async function getJSON<T>(
  url: string,
  options?: { headers?: Record<string, string> },
): Promise<T> {
  const r = await fetch(url, {
    headers: options?.headers,
    credentials: 'include',
  });
  if (!r.ok) throw await parseError(r);
  return r.json() as Promise<T>;
}

export async function postJSON<T>(
  url: string,
  body: unknown,
  options?: { headers?: Record<string, string> },
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
  if (!r.ok) throw await parseError(r);
  return r.json() as Promise<T>;
}

export async function putJSON<T>(
  url: string,
  body: unknown,
  options?: { headers?: Record<string, string> },
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
  if (!r.ok) throw await parseError(r);
  return r.json() as Promise<T>;
}

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

export async function getMyQuotas(): Promise<MyQuotas> {
  return getJSON<MyQuotas>(api('/quota/me/all'), { headers: authHeaders() });
}

export type SimulatePaymentResult = {
  order_id: number;
  product_code: string;
  membership_id?: number | null;
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

export type Order = {
  id: number;
  user_id: number;
  product_id: number;
  amount_cents: number;
  currency: string;
  status: 'CREATED' | 'PAID' | 'CANCELED' | 'REFUNDED' | string;
  out_trade_no: string;
  created_at: string;
};

export type Refund = {
  id: number;
  order_id: number;
  user_id: number;
  out_refund_no: string;
  wechat_refund_id?: string | null;
  refund_cents: number;
  total_cents: number;
  currency: string;
  reason?: string | null;
  status: 'CREATED' | 'PROCESSING' | 'SUCCESS' | 'CLOSED' | 'ABNORMAL' | 'FAILED' | string;
  requested_by?: number | null;
  requested_at: string;
  success_at?: string | null;
  failure_code?: string | null;
  failure_message?: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminOrderItem = Order & {
  user_email?: string | null;
  user_phone?: string | null;
  user_nickname?: string | null;
  product_code: string;
  product_name: string;
  product_kind: string;
  payment_channel?: string | null;
  transaction_id?: string | null;
  entitlement_trace: 'READY' | 'MISSING' | 'NOT_REQUIRED' | string;
  refund?: Refund | null;
};

export type AdminOrderList = {
  items: AdminOrderItem[];
  total: number;
  page: number;
  page_size: number;
};

export function getAdminOrders(params: {
  page?: number;
  pageSize?: number;
  orderStatus?: string;
  refundStatus?: string;
  search?: string;
}): Promise<AdminOrderList> {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    page_size: String(params.pageSize ?? 20),
  });
  if (params.orderStatus) query.set('order_status', params.orderStatus);
  if (params.refundStatus) query.set('refund_status', params.refundStatus);
  if (params.search) query.set('search', params.search);
  return getJSON<AdminOrderList>(api(`/admin/orders?${query.toString()}`), {
    headers: authHeaders(),
  });
}

export function createAdminRefund(orderId: number, reason: string): Promise<Refund> {
  return postJSON<Refund>(
    api(`/admin/orders/${orderId}/refund`),
    { reason },
    { headers: authHeaders() },
  );
}

export function syncAdminRefund(refundId: number): Promise<Refund> {
  return postJSON<Refund>(
    api(`/admin/refunds/${refundId}/sync`),
    {},
    { headers: authHeaders() },
  );
}

export type Payment = {
  id: number;
  order_id: number;
  channel: string;
  prepay_id?: string | null;
  pay_url?: string | null;
  transaction_id?: string | null;
  status: 'PENDING' | 'SUCCESS' | 'FAIL' | string;
  raw?: string | null;
  created_at?: string | null;
};

export type WeChatNativeCheckoutResult = {
  order: Order;
  payment: Payment;
  code_url: string;
};

export async function createWeChatNativeCheckout(productCode: string): Promise<WeChatNativeCheckoutResult> {
  return postJSON<WeChatNativeCheckoutResult>(
    api('/payments/wechat/native'),
    { product_code: productCode },
    { headers: authHeaders() },
  );
}

export async function getOrder(orderId: number): Promise<Order> {
  return getJSON<Order>(api(`/orders/${orderId}`), { headers: authHeaders() });
}

export function formatQuotaText(q: { total: number; remaining: number; is_unlimited: boolean }): string {
  if (q.is_unlimited || q.total === -1) return '无限';
  return `剩余 ${q.remaining} 次`;
}

export type ProductGrant = {
  id: number;
  quota_type: string;
  amount: number;
  valid_days?: number | null;
};

export type ProductDetail = {
  id: number;
  code: string;
  kind: 'one_time' | 'subscription' | 'topup' | string;
  period?: 'monthly' | 'yearly' | null;
  name: string;
  price_cents: number;
  currency: string;
  quota_amount: number;
  bazi_quota: number;
  liuyao_quota: number;
  description?: string | null;
  features?: Record<string, unknown> | null;
  active: boolean;
  grants: ProductGrant[];
};

export type Membership = {
  id: number;
  product_id: number;
  status: string;
  current_period_start: string;
  current_period_end: string;
  auto_renew: boolean;
};

export type MembershipMe = {
  active: boolean;
  membership: Membership | null;
  video_access: boolean;
};

export type VideoLesson = {
  id: number;
  course_id: number;
  slug: string;
  title: string;
  description?: string | null;
  cover_url?: string | null;
  duration_seconds?: number | null;
  sort_order: number;
  access_level: 'free' | 'member' | string;
  provider: string;
  is_active: boolean;
};

export type VideoCourse = {
  id: number;
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  cover_url?: string | null;
  sort_order: number;
  is_active: boolean;
  lessons: VideoLesson[];
};

export type VideoPlay = {
  lesson_id: number;
  play_url: string;
  provider: string;
};

export function getMembershipPlans(): Promise<ProductDetail[]> {
  return getJSON<ProductDetail[]>(api('/membership/plans'));
}

export function getTopupPackages(): Promise<ProductDetail[]> {
  return getJSON<ProductDetail[]>(api('/membership/topup-packages'));
}

export function getMyMembership(): Promise<MembershipMe> {
  return getJSON<MembershipMe>(api('/membership/me'), { headers: authHeaders() });
}

export function getVideoCourses(): Promise<VideoCourse[]> {
  return getJSON<VideoCourse[]>(api('/videos/courses'));
}

export function getVideoLesson(lessonId: number): Promise<VideoLesson> {
  return getJSON<VideoLesson>(api(`/videos/lessons/${lessonId}`));
}

export function getVideoPlay(lessonId: number): Promise<VideoPlay> {
  return postJSON<VideoPlay>(
    api(`/videos/lessons/${lessonId}/play`),
    {},
    { headers: authHeaders() },
  );
}

export function updateVideoProgress(
  lessonId: number,
  payload: { position_seconds: number; completed: boolean },
) {
  return postJSON(
    api(`/videos/lessons/${lessonId}/progress`),
    payload,
    { headers: authHeaders() },
  );
}
