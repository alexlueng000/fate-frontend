'use client';

import Link from 'next/link';
import { packageText } from '@/app/lib/product-display';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  RefreshCw,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import {
  AdminOrderItem,
  createAdminRefund,
  getAdminOrders,
  syncAdminRefund,
} from '@/app/lib/api';

const ORDER_STATUS: Record<string, { label: string; className: string }> = {
  CREATED: { label: '待支付', className: 'bg-slate-100 text-slate-700' },
  PAID: { label: '已支付', className: 'bg-emerald-50 text-emerald-700' },
  REFUNDING: { label: '退款中', className: 'bg-amber-50 text-amber-700' },
  REFUNDED: { label: '已退款', className: 'bg-blue-50 text-blue-700' },
  CANCELED: { label: '已取消', className: 'bg-slate-100 text-slate-500' },
};

const REFUND_STATUS: Record<string, { label: string; className: string }> = {
  CREATED: { label: '待提交', className: 'text-slate-600' },
  PROCESSING: { label: '微信处理中', className: 'text-amber-700' },
  SUCCESS: { label: '退款成功', className: 'text-emerald-700' },
  CLOSED: { label: '退款关闭', className: 'text-slate-600' },
  ABNORMAL: { label: '退款异常', className: 'text-red-700' },
  FAILED: { label: '提交失败', className: 'text-red-700' },
};

function formatMoney(cents: number) {
  return `¥${(cents / 100).toFixed(2)}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<AdminOrderItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [orderStatus, setOrderStatus] = useState('');
  const [refundStatus, setRefundStatus] = useState('');
  const [refundOrder, setRefundOrder] = useState<AdminOrderItem | null>(null);
  const [reason, setReason] = useState('用户申请退款');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 20;

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('me');
      const me = raw ? JSON.parse(raw) : null;
      if (!me?.is_admin) router.push('/login?redirect=/admin/orders');
    } catch {
      router.push('/login?redirect=/admin/orders');
    }
  }, [router]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminOrders({
        page,
        pageSize,
        orderStatus,
        refundStatus,
        search,
      });
      setOrders(data.items);
      setTotal(data.total);
    } catch (err) {
      setError((err as Error).message || '订单加载失败');
    } finally {
      setLoading(false);
    }
  }, [page, orderStatus, refundStatus, search]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);

  async function submitRefund() {
    if (!refundOrder || !reason.trim()) return;
    setActionId(refundOrder.id);
    setError(null);
    setMessage(null);
    try {
      const refund = await createAdminRefund(refundOrder.id, reason.trim());
      setMessage(`退款单 ${refund.out_refund_no} 已提交，当前状态：${refund.status}`);
      setRefundOrder(null);
      await loadOrders();
    } catch (err) {
      setError((err as Error).message || '退款申请失败');
    } finally {
      setActionId(null);
    }
  }

  async function syncRefund(order: AdminOrderItem) {
    if (!order.refund) return;
    setActionId(order.id);
    setError(null);
    setMessage(null);
    try {
      const refund = await syncAdminRefund(order.refund.id);
      setMessage(`退款状态已同步：${refund.status}`);
      await loadOrders();
    } catch (err) {
      setError((err as Error).message || '退款状态同步失败');
    } finally {
      setActionId(null);
    }
  }

  return (
    <main className="min-h-screen px-4 pb-12 pt-20">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/admin"
          className="mb-5 inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          返回管理后台
        </Link>

        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">订单与退款</h1>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">共 {total} 笔订单</p>
          </div>
          <button
            type="button"
            onClick={() => void loadOrders()}
            disabled={loading}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] px-4 text-sm disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>

        {(error || message) && (
          <div className={`mb-5 rounded-lg border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            {error || message}
          </div>
        )}

        <section className="card mb-6 p-4">
          <div className="grid gap-3 md:grid-cols-[minmax(240px,1fr)_180px_180px_auto]">
            <form
              className="relative"
              onSubmit={(event) => {
                event.preventDefault();
                setPage(1);
                setSearch(searchInput.trim());
              }}
            >
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="订单号、用户、商品"
                className="min-h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] pl-10 pr-3 text-sm outline-none focus:border-[var(--color-primary)]"
              />
            </form>
            <select
              value={orderStatus}
              onChange={(event) => { setOrderStatus(event.target.value); setPage(1); }}
              className="min-h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 text-sm"
            >
              <option value="">全部订单状态</option>
              {Object.entries(ORDER_STATUS).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}
            </select>
            <select
              value={refundStatus}
              onChange={(event) => { setRefundStatus(event.target.value); setPage(1); }}
              className="min-h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 text-sm"
            >
              <option value="">全部退款状态</option>
              {Object.entries(REFUND_STATUS).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}
            </select>
            <button
              type="button"
              onClick={() => { setSearchInput(''); setSearch(''); setOrderStatus(''); setRefundStatus(''); setPage(1); }}
              className="min-h-11 rounded-lg border border-[var(--color-border)] px-4 text-sm"
            >
              重置
            </button>
          </div>
        </section>

        <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-[var(--color-bg-elevated)] text-xs text-[var(--color-text-muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">订单</th>
                  <th className="px-4 py-3 font-medium">用户</th>
                  <th className="px-4 py-3 font-medium">商品/金额</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                  <th className="px-4 py-3 font-medium">退款</th>
                  <th className="px-4 py-3 font-medium">权益追踪</th>
                  <th className="px-4 py-3 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {orders.map((order) => {
                  const orderState = ORDER_STATUS[order.status] ?? { label: order.status, className: 'bg-slate-100 text-slate-700' };
                  const refundState = order.refund ? REFUND_STATUS[order.refund.status] : null;
                  return (
                    <tr key={order.id} className="align-top hover:bg-[var(--color-bg-hover)]">
                      <td className="px-4 py-4">
                        <p className="font-medium text-[var(--color-text-primary)]">#{order.id}</p>
                        <p className="mt-1 max-w-48 break-all text-xs text-[var(--color-text-muted)]">{order.out_trade_no}</p>
                        <p className="mt-1 text-xs text-[var(--color-text-hint)]">{formatDate(order.created_at)}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p>{order.user_nickname || order.user_email || `用户 ${order.user_id}`}</p>
                        <p className="mt-1 text-xs text-[var(--color-text-muted)]">{order.user_email || order.user_phone || '—'}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p>{order.product_kind === 'subscription' ? packageText(order.product_name) : order.product_name}</p>
                        <p className="mt-1 text-xs text-[var(--color-text-muted)]">{order.product_code}</p>
                        <p className="mt-2 font-semibold">{formatMoney(order.amount_cents)}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${orderState.className}`}>{orderState.label}</span>
                        <p className="mt-2 text-xs text-[var(--color-text-muted)]">{order.payment_channel || '—'}</p>
                      </td>
                      <td className="px-4 py-4">
                        {order.refund && refundState ? (
                          <>
                            <p className={`font-medium ${refundState.className}`}>{refundState.label}</p>
                            <p className="mt-1 text-xs text-[var(--color-text-muted)]">{order.refund.out_refund_no}</p>
                            {order.refund.failure_message && <p className="mt-2 max-w-56 text-xs text-red-600">{order.refund.failure_message}</p>}
                          </>
                        ) : <span className="text-[var(--color-text-hint)]">—</span>}
                      </td>
                      <td className="px-4 py-4">
                        {order.entitlement_trace === 'READY' ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-700"><CheckCircle2 className="h-4 w-4" />可追溯</span>
                        ) : order.entitlement_trace === 'MISSING' ? (
                          <span className="inline-flex items-center gap-1 text-xs text-red-700"><AlertTriangle className="h-4 w-4" />历史订单缺失</span>
                        ) : <span className="text-xs text-[var(--color-text-muted)]">无需权益</span>}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {order.status === 'PAID' && !order.refund && (
                            <button
                              type="button"
                              onClick={() => { setRefundOrder(order); setReason('用户申请退款'); }}
                              disabled={actionId === order.id}
                              className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-red-200 px-3 text-xs text-red-700 disabled:opacity-50"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />申请退款
                            </button>
                          )}
                          {order.refund && !['SUCCESS', 'CLOSED'].includes(order.refund.status) && (
                            <button
                              type="button"
                              onClick={() => void syncRefund(order)}
                              disabled={actionId === order.id}
                              className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-[var(--color-border)] px-3 text-xs disabled:opacity-50"
                            >
                              <RefreshCw className={`h-3.5 w-3.5 ${actionId === order.id ? 'animate-spin' : ''}`} />同步
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!loading && orders.length === 0 && (
            <div className="py-16 text-center text-sm text-[var(--color-text-muted)]">暂无符合条件的订单</div>
          )}
          {loading && orders.length === 0 && (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-[var(--color-text-muted)]"><RefreshCw className="h-4 w-4 animate-spin" />加载中</div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between text-sm">
          <span className="text-[var(--color-text-muted)]">第 {page} / {totalPages} 页</span>
          <div className="flex gap-2">
            <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-[var(--color-border)] px-4 py-2 disabled:opacity-40">上一页</button>
            <button type="button" disabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-[var(--color-border)] px-4 py-2 disabled:opacity-40">下一页</button>
          </div>
        </div>
      </div>

      {refundOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4" role="dialog" aria-modal="true" aria-labelledby="refund-title">
          <div className="w-full max-w-lg rounded-xl bg-[var(--color-bg-card)] p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="refund-title" className="text-xl font-bold">确认整单退款</h2>
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">订单 #{refundOrder.id}，退款金额 {formatMoney(refundOrder.amount_cents)}</p>
              </div>
              <button type="button" onClick={() => setRefundOrder(null)} className="rounded-lg p-2 hover:bg-[var(--color-bg-hover)]" aria-label="关闭"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              款项将原路退回微信。退款成功后，系统会撤销该订单尚未使用的额度和对应套餐期限。
            </div>
            {refundOrder.entitlement_trace === 'MISSING' && (
              <div className="mt-3 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />该历史订单缺少权益流水，退款后可能需要人工处理权益。</div>
            )}
            <label className="mt-5 block text-sm font-medium" htmlFor="refund-reason">退款原因</label>
            <textarea id="refund-reason" value={reason} maxLength={256} onChange={(event) => setReason(event.target.value)} rows={3} className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-3 text-sm outline-none focus:border-[var(--color-primary)]" />
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setRefundOrder(null)} className="min-h-10 rounded-lg border border-[var(--color-border)] px-4 text-sm">取消</button>
              <button type="button" onClick={() => void submitRefund()} disabled={!reason.trim() || actionId === refundOrder.id} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-medium text-white disabled:opacity-50">
                {actionId === refundOrder.id ? <Clock3 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}确认退款
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
