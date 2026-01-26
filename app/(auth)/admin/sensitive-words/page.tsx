'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, postJSON, putJSON } from '@/app/lib/api';
import {
  ArrowLeft,
  Plus,
  X,
  Loader2,
  Shield,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Edit3,
  Search,
  Eraser,
} from 'lucide-react';

type SensitiveWord = {
  id: number;
  word: string;
  replacement: string;
  category: string;
  is_regex: boolean;
  priority: number;
  status: number;
  note: string | null;
  created_at: string;
  updated_at: string;
};

type ListResponse = {
  items: SensitiveWord[];
  total: number;
  limit: number;
  offset: number;
};

const CATEGORIES = [
  { value: 'general', label: '通用' },
  { value: '术语', label: '术语' },
  { value: '迷信', label: '迷信' },
  { value: '确定性', label: '确定性' },
  { value: '冲突', label: '冲突' },
  { value: '功利', label: '功利' },
];

export default function SensitiveWordsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [words, setWords] = useState<SensitiveWord[]>([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 表单状态
  const [showForm, setShowForm] = useState(false);
  const [editingWord, setEditingWord] = useState<SensitiveWord | null>(null);
  const [formData, setFormData] = useState({
    word: '',
    replacement: '',
    category: 'general',
    is_regex: false,
    priority: 0,
    note: '',
  });
  const [saving, setSaving] = useState(false);

  // 操作状态
  const [operating, setOperating] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const getToken = useCallback(() => {
    return localStorage.getItem('auth_token');
  }, []);

  // 加载敏感词列表
  const loadWords = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const token = getToken();
      const params = new URLSearchParams();
      if (statusFilter !== null) params.set('status', String(statusFilter));
      if (categoryFilter) params.set('category', categoryFilter);
      if (searchQuery) params.set('search', searchQuery);
      params.set('limit', '200');

      const resp = await fetch(api(`/admin/sensitive-words?${params}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error('加载失败');
      const data: ListResponse = await resp.json();
      setWords(data.items);
      setTotal(data.total);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, searchQuery, getToken]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('me');
      if (!raw) {
        router.push('/login?redirect=/admin/sensitive-words');
        return;
      }
      const user = JSON.parse(raw);
      if (!user || !user.is_admin) {
        router.push('/login?redirect=/admin/sensitive-words');
        return;
      }
    } catch {
      router.push('/login?redirect=/admin/sensitive-words');
      return;
    }
    loadWords();
  }, [router, loadWords]);

  // 打开创建表单
  function openCreateForm() {
    setEditingWord(null);
    setFormData({
      word: '',
      replacement: '',
      category: 'general',
      is_regex: false,
      priority: 0,
      note: '',
    });
    setShowForm(true);
  }

  // 打开编辑表单
  function openEditForm(word: SensitiveWord) {
    setEditingWord(word);
    setFormData({
      word: word.word,
      replacement: word.replacement,
      category: word.category,
      is_regex: word.is_regex,
      priority: word.priority,
      note: word.note || '',
    });
    setShowForm(true);
  }

  // 保存敏感词
  async function handleSave() {
    if (!formData.word.trim() || !formData.replacement.trim()) {
      setErr('敏感词和替换词不能为空');
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const token = getToken();
      if (editingWord) {
        await putJSON(api(`/admin/sensitive-words/${editingWord.id}`), formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await postJSON(api('/admin/sensitive-words'), formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setShowForm(false);
      loadWords();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  // 切换状态
  async function toggleStatus(id: number, currentStatus: number) {
    setOperating(id);
    try {
      const token = getToken();
      const action = currentStatus === 1 ? 'disable' : 'enable';
      const resp = await fetch(api(`/admin/sensitive-words/${id}/${action}`), {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error('操作失败');
      loadWords();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setOperating(null);
    }
  }

  // 删除敏感词
  async function deleteWord(id: number) {
    if (!confirm('确定要删除这个敏感词吗？')) return;
    setOperating(id);
    try {
      const token = getToken();
      const resp = await fetch(api(`/admin/sensitive-words/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error('删除失败');
      loadWords();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setOperating(null);
    }
  }

  // 清除缓存
  async function clearCache() {
    try {
      const token = getToken();
      const resp = await fetch(api('/admin/sensitive-words/clear-cache'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error('清除缓存失败');
      alert('缓存已清除');
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  // 状态标签
  function StatusBadge({ status }: { status: number }) {
    if (status === 1) return <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400">启用</span>;
    return <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-400">禁用</span>;
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
    <main className="min-h-screen pt-20 pb-8 px-4">
      <div className="max-w-6xl mx-auto">
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
            <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
                敏感词管理
              </h1>
              <p className="text-sm text-[var(--color-text-muted)]">共 {total} 个敏感词</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={clearCache} className="btn btn-secondary p-2" title="清除缓存">
              <Eraser className="w-5 h-5" />
            </button>
            <button onClick={() => loadWords()} className="btn btn-secondary p-2" title="刷新">
              <RefreshCw className="w-5 h-5" />
            </button>
            <button onClick={openCreateForm} className="btn btn-primary">
              <Plus className="w-5 h-5" />
              添加敏感词
            </button>
          </div>
        </div>

        {/* Error */}
        {err && (
          <div className="mb-4 rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-4 py-3 text-sm text-[var(--color-primary)]">
            {err}
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="card p-6 w-full max-w-md animate-scale-in">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  {editingWord ? '编辑敏感词' : '添加敏感词'}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-[var(--color-text-secondary)] mb-1.5">敏感词 *</label>
                  <input
                    className="input"
                    value={formData.word}
                    onChange={(e) => setFormData({ ...formData, word: e.target.value })}
                    placeholder="输入敏感词"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[var(--color-text-secondary)] mb-1.5">替换词 *</label>
                  <input
                    className="input"
                    value={formData.replacement}
                    onChange={(e) => setFormData({ ...formData, replacement: e.target.value })}
                    placeholder="输入替换词"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[var(--color-text-secondary)] mb-1.5">分类</label>
                  <select
                    className="input"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-[var(--color-text-secondary)] mb-1.5">优先级</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                    min={0}
                  />
                  <p className="text-xs text-[var(--color-text-hint)] mt-1">数字越大越先匹配</p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_regex"
                    checked={formData.is_regex}
                    onChange={(e) => setFormData({ ...formData, is_regex: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="is_regex" className="text-sm text-[var(--color-text-secondary)]">正则匹配</label>
                </div>

                <div>
                  <label className="block text-xs text-[var(--color-text-secondary)] mb-1.5">备注</label>
                  <input
                    className="input"
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    placeholder="可选备注"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowForm(false)} className="flex-1 btn btn-secondary">
                  取消
                </button>
                <button onClick={handleSave} disabled={saving} className="flex-1 btn btn-primary">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : '保存'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {/* Status Filter */}
          <div className="flex gap-1">
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
              启用
            </button>
            <button
              onClick={() => setStatusFilter(0)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${statusFilter === 0 ? 'bg-yellow-500 text-white' : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)]/80'}`}
            >
              禁用
            </button>
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter || ''}
            onChange={(e) => setCategoryFilter(e.target.value || null)}
            className="px-3 py-1.5 rounded-lg text-sm bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] border-none"
          >
            <option value="">全部分类</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>

          {/* Search */}
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-hint)]" />
            <input
              type="text"
              placeholder="搜索敏感词或替换词..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg text-sm bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] border-none"
            />
          </div>
        </div>

        {/* Words List */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="text-left py-3 px-4 text-xs font-medium text-[var(--color-text-muted)]">敏感词</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-[var(--color-text-muted)]">替换词</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-[var(--color-text-muted)]">分类</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-[var(--color-text-muted)]">优先级</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-[var(--color-text-muted)]">状态</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-[var(--color-text-muted)]">操作</th>
                </tr>
              </thead>
              <tbody>
                {words.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[var(--color-text-muted)]">
                      暂无敏感词
                    </td>
                  </tr>
                ) : (
                  words.map((word) => (
                    <tr key={word.id} className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-bg-elevated)]/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-[var(--color-text-primary)]">{word.word}</span>
                          {word.is_regex && (
                            <span className="px-1.5 py-0.5 text-xs rounded bg-purple-500/20 text-purple-400">正则</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-[var(--color-text-secondary)]">{word.replacement}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {CATEGORIES.find(c => c.value === word.category)?.label || word.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-[var(--color-text-muted)]">{word.priority}</span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={word.status} />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          {operating === word.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-[var(--color-text-hint)]" />
                          ) : (
                            <>
                              <button
                                onClick={() => openEditForm(word)}
                                className="p-1.5 rounded-lg text-[var(--color-text-hint)] hover:text-[var(--color-gold)] hover:bg-[var(--color-bg-elevated)] transition-colors"
                                title="编辑"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => toggleStatus(word.id, word.status)}
                                className="p-1.5 rounded-lg text-[var(--color-text-hint)] hover:text-[var(--color-gold)] hover:bg-[var(--color-bg-elevated)] transition-colors"
                                title={word.status === 1 ? '禁用' : '启用'}
                              >
                                {word.status === 1 ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => deleteWord(word.id)}
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
