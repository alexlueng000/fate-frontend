'use client';

import Link from 'next/link';
import { withPackageDisplay } from '@/app/lib/product-display';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, BadgeDollarSign, RefreshCw, Save } from 'lucide-react';
import {
  ProductDetail,
  getAdminProducts,
  updateAdminProductPrice,
} from '@/app/lib/api';

function yuanToCents(value: string): number | null {
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) return null;
  const cents = Math.round(Number(value) * 100);
  return cents >= 1 && cents <= 100_000_000 ? cents : null;
}

function formatYuan(cents: number) {
  return (cents / 100).toFixed(2);
}

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductDetail[]>([]);
  const [prices, setPrices] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('me');
      const me = raw ? JSON.parse(raw) : null;
      if (!me?.is_admin) router.push('/login?redirect=/admin/products');
    } catch {
      router.push('/login?redirect=/admin/products');
    }
  }, [router]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminProducts();
      setProducts(data.map(withPackageDisplay));
      setPrices(Object.fromEntries(data.map((product) => [product.id, formatYuan(product.price_cents)])));
    } catch (reason) {
      setError((reason as Error).message || '商品加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  async function savePrice(product: ProductDetail) {
    const cents = yuanToCents(prices[product.id] ?? '');
    if (cents === null) {
      setError('请输入大于 0 的有效价格，最多保留两位小数。');
      return;
    }
    setSavingId(product.id);
    setError(null);
    setMessage(null);
    try {
      const updated = withPackageDisplay(await updateAdminProductPrice(product.id, cents));
      setProducts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setPrices((current) => ({ ...current, [updated.id]: formatYuan(updated.price_cents) }));
      setMessage(`${updated.name}的价格已更新为 ¥${formatYuan(updated.price_cents)}，新订单立即生效。`);
    } catch (reason) {
      setError((reason as Error).message || '价格保存失败');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main className="min-h-screen px-4 pb-12 pt-20">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin" className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
          <ArrowLeft className="h-4 w-4" />返回管理后台
        </Link>

        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-primary)]/10">
              <BadgeDollarSign className="h-6 w-6 text-[var(--color-primary)]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">商品价格配置</h1>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">金额单位为人民币元；修改仅影响之后创建的新订单。</p>
            </div>
          </div>
          <button type="button" onClick={() => void loadProducts()} disabled={loading} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-black/10 px-4 text-sm disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />刷新
          </button>
        </div>

        {error && <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {message && <div role="status" className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div>}

        <div className="overflow-x-auto rounded-xl border border-black/10 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-[var(--color-primary)] text-white">
              <tr>
                <th className="px-5 py-4 font-semibold">商品</th>
                <th className="px-5 py-4 font-semibold">类型</th>
                <th className="px-5 py-4 font-semibold">状态</th>
                <th className="px-5 py-4 font-semibold">价格（元）</th>
                <th className="px-5 py-4 font-semibold">操作</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const changed = yuanToCents(prices[product.id] ?? '') !== product.price_cents;
                return (
                  <tr key={product.id} className="border-t border-black/5">
                    <td className="px-5 py-4">
                      <p className="font-medium text-[var(--color-text-primary)]">{product.name}</p>
                      <p className="mt-1 font-mono text-xs text-[var(--color-text-muted)]">{product.code}</p>
                    </td>
                    <td className="px-5 py-4 text-[var(--color-text-muted)]">{product.kind === 'subscription' ? '套餐' : product.kind === 'topup' ? '加购包' : '单次商品'}</td>
                    <td className="px-5 py-4">{product.active ? '在售' : '已下架'}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span>¥</span>
                        <input
                          value={prices[product.id] ?? ''}
                          onChange={(event) => setPrices((current) => ({ ...current, [product.id]: event.target.value }))}
                          inputMode="decimal"
                          aria-label={`${product.name}价格`}
                          className="min-h-11 w-36 rounded-lg border border-black/15 px-3 text-blue-700 outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                        />
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <button type="button" onClick={() => void savePrice(product)} disabled={!changed || savingId !== null} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 font-medium text-white disabled:cursor-not-allowed disabled:opacity-40">
                        <Save className="h-4 w-4" />{savingId === product.id ? '保存中' : '保存'}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!loading && products.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-[var(--color-text-muted)]">暂无商品</td></tr>}
            </tbody>
          </table>
          {loading && <div className="p-10 text-center text-sm text-[var(--color-text-muted)]">正在加载商品…</div>}
        </div>
      </div>
    </main>
  );
}
