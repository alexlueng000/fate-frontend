'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, postJSON } from '@/app/lib/api';
import {
  ArrowLeft,
  Plus,
  Copy,
  Check,
  X,
  Loader2,
  Ticket,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Users,
} from 'lucide-react';

type InvitationCode = {
  id: number;
  code: string;
  code_type: string;
  max_uses: number;
  used_count: number;
  status: number;
  expires_at: string | null;
  created_by: number | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

type ListResponse = {
  items: InvitationCode[];
  total: number;
  limit: number;
  offset: number;
};

export default function InvitationCodesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [codes, setCodes] = useState<InvitationCode[]>([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<number | null>(null);

  // 创建表单状态
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createMode, setCreateMode] = useState<'single' | 'batch'>('single');
  const [customCode, setCustomCode] = useState('');
  const [batchCount, setBatchCount] = useState(10);
  const [codeType, setCodeType] = useState('single_use');
  const [maxUses, setMaxUses] = useState(1);
  const [note, setNote] = useState('');
  const [creating, setCreating] = useState(false);

  // 复制状态
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // 操作状态
  const [operating, setOperating] = useState<number | null>(null);

  const [err, setErr] = useState<string | null>(null);

  // 获取token
  const getToken = useCallback(() => {
    return localStorage.getItem('auth_token');
  }, []);

  // 加载邀请码列表
  const loadCodes = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const token = getToken();
      const params = new URLSearchParams();
      if (statusFilter !== null) params.set('status', String(statusFilter));
      params.set('limit', '100');

      const resp = await fetch(api(`/admin/invitation-codes?${params}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error('加载失败');
      const data: ListResponse = await resp.json();
      setCodes(data.items);
      setTotal(data.total);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, getToken]);

  useEffect(() => {
    // 检查管理员权限
    try {
      const raw = sessionStorage.getItem('me');
      if (!raw) {
        router.push('/login?redirect=/admin/invitation-codes');
        return;
      }
      const user = JSON.parse(raw);
      if (!user || !user.is_admin) {
        router.push('/login?redirect=/admin/invitation-codes');
        return;
      }
    } catch {
      router.push('/login?redirect=/admin/invitation-codes');
      return;
    }
    loadCodes();
  }, [router, loadCodes]);

  // 创建邀请码
  async function handleCreate() {
    setCreating(true);
    setErr(null);
    try {
      const token = getToken();
      if (createMode === 'single') {
        await postJSON(api('/admin/invitation-codes'), {
          code: customCode || undefined,
          code_type: codeType,
          max_uses: maxUses,
          note: note || undefined,
        }, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await postJSON(api('/admin/invitation-codes/batch'), {
          count: batchCount,
          code_type: codeType,
          max_uses: maxUses,
          note: note || undefined,
        }, { headers: { Authorization: `Bearer ${token}` } });
      }
      setShowCreateForm(false);
      setCustomCode('');
      setNote('');
      loadCodes();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setCreating(false);
    }
  }

  // 复制邀请码
  async function copyCode(code: string, id: number) {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  // 禁用/启用邀请码
  async function toggleStatus(id: number, currentStatus: number) {
    setOperating(id);
    try {
      const token = getToken();
      const action = currentStatus === 1 ? 'disable' : 'enable';
      const resp = await fetch(api(`/admin/invitation-codes/${id}/${action}`), {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error('操作失败');
      loadCodes();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setOperating(null);
    }
  }

  // 删除邀请码
  async function deleteCode(id: number) {
    if (!confirm('确定要删除这个邀请码吗？')) return;
    setOperating(id);
    try {
      const token = getToken();
      const resp = await fetch(api(`/admin/invitation-codes/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error('删除失败');
      loadCodes();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setOperating(null);
    }
  }

  // 状态标签
  function StatusBadge({ status }: { status: number }) {
    if (status === 1) return <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400">有效</span>;
    if (status === 0) return <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-400">禁用</span>;
    return <span className="px-2 py-0.5 text-xs rounded-full bg-gray-500/20 text-gray-400">已删除</span>;
  }

  // 类型标签
  function TypeBadge({ type }: { type: string }) {
    if (type === 'single_use') return <span className="text-xs text-[var(--color-text-muted)]">单次</span>;
    if (type === 'multi_use') return <span className="text-xs text-[var(--color-text-muted)]">多次</span>;
    return <span className="text-xs text-[var(--color-text-muted)]">无限</span>;
  }

  // 加载中
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-gold)] border-t-transparent animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Back Link */}
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          返回管理后台
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
              <Ticket className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
                邀请码管理
              </h1>
              <p className="text-sm text-[var(--color-text-muted)]">共 {total} 个邀请码</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadCodes()}
              className="btn btn-secondary p-2"
              title="刷新"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn btn-primary"
            >
              <Plus className="w-5 h-5" />
              创建邀请码
            </button>
          </div>
        </div>

        {/* Error */}
        {err && (
          <div className="mb-4 rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-4 py-3 text-sm text-[var(--color-primary)]">
            {err}
          </div>
        )}

        {/* Create Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="card p-6 w-full max-w-md animate-scale-in">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">创建邀请码</h2>
                <button onClick={() => setShowCreateForm(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mode Toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setCreateMode('single')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${createMode === 'single' ? 'bg-[var(--color-gold)] text-white' : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]'}`}
                >
                  单个创建
                </button>
                <button
                  onClick={() => setCreateMode('batch')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${createMode === 'batch' ? 'bg-[var(--color-gold)] text-white' : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]'}`}
                >
                  批量创建
                </button>
              </div>

              <div className="space-y-4">
                {createMode === 'single' ? (
                  <div>
                    <label className="block text-xs text-[var(--color-text-secondary)] mb-1.5">自定义邀请码（可选）</label>
                    <input
                      className="input"
                      value={customCode}
                      onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                      placeholder="留空则自动生成"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs text-[var(--color-text-secondary)] mb-1.5">生成数量</label>
                    <input
                      type="number"
                      className="input"
                      value={batchCount}
                      onChange={(e) => setBatchCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                      min={1}
                      max={100}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs text-[var(--color-text-secondary)] mb-1.5">类型</label>
                  <select
                    className="input"
                    value={codeType}
                    onChange={(e) => setCodeType(e.target.value)}
                  >
                    <option value="single_use">单次使用</option>
                    <option value="multi_use">多次使用</option>
                    <option value="unlimited">无限使用</option>
                  </select>
                </div>

                {codeType !== 'unlimited' && (
                  <div>
                    <label className="block text-xs text-[var(--color-text-secondary)] mb-1.5">最大使用次数</label>
                    <input
                      type="number"
                      className="input"
                      value={maxUses}
                      onChange={(e) => setMaxUses(Math.max(1, parseInt(e.target.value) || 1))}
                      min={1}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs text-[var(--color-text-secondary)] mb-1.5">备注（可选）</label>
                  <input
                    className="input"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="例如：送给朋友"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowCreateForm(false)} className="flex-1 btn btn-secondary">
                  取消
                </button>
                <button onClick={handleCreate} disabled={creating} className="flex-1 btn btn-primary">
                  {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : '创建'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Filter */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setStatusFilter(null)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${statusFilter === null ? 'bg-[var(--color-gold)] text-white' : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)]/80'}`}
          >
            全部
          </button>
          <button
            onClick={() => setStatusFilter(1)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${statusFilter === 1 ? 'bg-green-500 text-white' : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)]/80'}`}
          >
            有效
          </button>
          <button
            onClick={() => setStatusFilter(0)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${statusFilter === 0 ? 'bg-yellow-500 text-white' : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)]/80'}`}
          >
            禁用
          </button>
        </div>

        {/* Codes List */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="text-left py-3 px-4 text-xs font-medium text-[var(--color-text-muted)]">邀请码</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-[var(--color-text-muted)]">类型</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-[var(--color-text-muted)]">使用情况</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-[var(--color-text-muted)]">状态</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-[var(--color-text-muted)]">备注</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-[var(--color-text-muted)]">创建时间</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-[var(--color-text-muted)]">操作</th>
                </tr>
              </thead>
              <tbody>
                {codes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[var(--color-text-muted)]">
                      暂无邀请码
                    </td>
                  </tr>
                ) : (
                  codes.map((code) => (
                    <tr key={code.id} className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-bg-elevated)]/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-sm text-[var(--color-text-primary)]">{code.code}</code>
                          <button
                            onClick={() => copyCode(code.code, code.id)}
                            className="text-[var(--color-text-hint)] hover:text-[var(--color-gold)] transition-colors"
                            title="复制"
                          >
                            {copiedId === code.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <TypeBadge type={code.code_type} />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-sm">
                          <Users className="w-4 h-4 text-[var(--color-text-hint)]" />
                          <span className="text-[var(--color-text-secondary)]">
                            {code.used_count} / {code.max_uses === 0 ? '∞' : code.max_uses}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={code.status} />
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-[var(--color-text-muted)] truncate max-w-[150px] block">
                          {code.note || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-[var(--color-text-muted)]">
                          {new Date(code.created_at).toLocaleDateString('zh-CN')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          {operating === code.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-[var(--color-text-hint)]" />
                          ) : (
                            <>
                              <button
                                onClick={() => toggleStatus(code.id, code.status)}
                                className="p-1.5 rounded-lg text-[var(--color-text-hint)] hover:text-[var(--color-gold)] hover:bg-[var(--color-bg-elevated)] transition-colors"
                                title={code.status === 1 ? '禁用' : '启用'}
                              >
                                {code.status === 1 ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => deleteCode(code.id)}
                                className="p-1.5 rounded-lg text-[var(--color-text-hint)] hover:text-[var(--color-primary)] hover:bg-[var(--color-bg-elevated)] transition-colors"
                                title="删除"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}