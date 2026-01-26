'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, postJSON } from '@/app/lib/api';
import {
  ArrowLeft,
  Plus,
  X,
  Loader2,
  Zap,
  RefreshCw,
  GripVertical,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Edit3,
  Save,
} from 'lucide-react';

type QuickButton = {
  label: string;
  prompt: string;
  order: number;
  active: boolean;
};

type ConfigData = {
  key: string;
  version: number;
  value_json: {
    items: QuickButton[];
  };
  updated_at?: string;
};

export default function QuickButtonsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [buttons, setButtons] = useState<QuickButton[]>([]);
  const [version, setVersion] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // 编辑状态
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState({ label: '', prompt: '' });

  const getToken = useCallback(() => {
    return localStorage.getItem('auth_token');
  }, []);

  // 加载配置
  const loadConfig = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const token = getToken();
      const resp = await fetch(api('/admin/config?key=quick_buttons'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) {
        if (resp.status === 404) {
          // 配置不存在，使用默认值
          setButtons([]);
          setVersion(0);
          return;
        }
        throw new Error('加载失败');
      }
      const data: ConfigData = await resp.json();
      setButtons(data.value_json?.items || []);
      setVersion(data.version);
      setHasChanges(false);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('me');
      if (!raw) {
        router.push('/login?redirect=/admin/config/quick_buttons');
        return;
      }
      const user = JSON.parse(raw);
      if (!user || !user.is_admin) {
        router.push('/login?redirect=/admin/config/quick_buttons');
        return;
      }
    } catch {
      router.push('/login?redirect=/admin/config/quick_buttons');
      return;
    }
    loadConfig();
  }, [router, loadConfig]);

  // 保存配置
  async function saveConfig() {
    setSaving(true);
    setErr(null);
    try {
      const token = getToken();
      await postJSON(api('/admin/config/save'), {
        key: 'quick_buttons',
        value_json: { items: buttons },
        comment: '更新快捷按钮配置',
      }, { headers: { Authorization: `Bearer ${token}` } });
      setHasChanges(false);
      await loadConfig();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  // 打开添加表单
  function openAddForm() {
    setEditingIndex(null);
    setFormData({ label: '', prompt: '' });
    setShowForm(true);
  }

  // 打开编辑表单
  function openEditForm(index: number) {
    const btn = buttons[index];
    setEditingIndex(index);
    setFormData({ label: btn.label, prompt: btn.prompt });
    setShowForm(true);
  }

  // 保存按钮
  function handleSaveButton() {
    if (!formData.label.trim() || !formData.prompt.trim()) {
      setErr('标签和提示词不能为空');
      return;
    }

    const newButtons = [...buttons];
    if (editingIndex !== null) {
      newButtons[editingIndex] = {
        ...newButtons[editingIndex],
        label: formData.label,
        prompt: formData.prompt,
      };
    } else {
      newButtons.push({
        label: formData.label,
        prompt: formData.prompt,
        order: newButtons.length,
        active: true,
      });
    }
    setButtons(newButtons);
    setHasChanges(true);
    setShowForm(false);
  }

  // 切换启用状态
  function toggleActive(index: number) {
    const newButtons = [...buttons];
    newButtons[index] = { ...newButtons[index], active: !newButtons[index].active };
    setButtons(newButtons);
    setHasChanges(true);
  }

  // 删除按钮
  function deleteButton(index: number) {
    if (!confirm('确定要删除这个快捷按钮吗？')) return;
    const newButtons = buttons.filter((_, i) => i !== index);
    // 重新排序
    newButtons.forEach((btn, i) => { btn.order = i; });
    setButtons(newButtons);
    setHasChanges(true);
  }

  // 移动按钮
  function moveButton(index: number, direction: 'up' | 'down') {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === buttons.length - 1) return;

    const newButtons = [...buttons];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newButtons[index], newButtons[targetIndex]] = [newButtons[targetIndex], newButtons[index]];
    // 重新排序
    newButtons.forEach((btn, i) => { btn.order = i; });
    setButtons(newButtons);
    setHasChanges(true);
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
      <div className="max-w-4xl mx-auto">
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
            <div className="w-12 h-12 rounded-xl bg-[var(--color-gold)] flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
                快捷按钮管理
              </h1>
              <p className="text-sm text-[var(--color-text-muted)]">
                版本 {version} · {buttons.length} 个按钮
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => loadConfig()} className="btn btn-secondary p-2" title="刷新">
              <RefreshCw className="w-5 h-5" />
            </button>
            <button onClick={openAddForm} className="btn btn-secondary">
              <Plus className="w-5 h-5" />
              添加按钮
            </button>
            <button
              onClick={saveConfig}
              disabled={saving || !hasChanges}
              className="btn btn-primary"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              保存
            </button>
          </div>
        </div>

        {/* Error */}
        {err && (
          <div className="mb-4 rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-4 py-3 text-sm text-[var(--color-primary)]">
            {err}
          </div>
        )}

        {/* Unsaved Changes Warning */}
        {hasChanges && (
          <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600">
            有未保存的更改，请点击"保存"按钮保存配置
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="card p-6 w-full max-w-md animate-scale-in">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  {editingIndex !== null ? '编辑按钮' : '添加按钮'}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-[var(--color-text-secondary)] mb-1.5">按钮标签 *</label>
                  <input
                    className="input"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder="例如：分析事业"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[var(--color-text-secondary)] mb-1.5">提示词 *</label>
                  <textarea
                    className="input min-h-[120px]"
                    value={formData.prompt}
                    onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                    placeholder="点击按钮后发送给 AI 的提示词"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowForm(false)} className="flex-1 btn btn-secondary">
                  取消
                </button>
                <button onClick={handleSaveButton} className="flex-1 btn btn-primary">
                  确定
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Buttons List */}
        <div className="card overflow-hidden">
          {buttons.length === 0 ? (
            <div className="py-12 text-center text-[var(--color-text-muted)]">
              暂无快捷按钮，点击"添加按钮"创建
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {buttons.map((btn, index) => (
                <div
                  key={index}
                  className={`p-4 flex items-start gap-4 ${!btn.active ? 'opacity-50' : ''}`}
                >
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveButton(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-[var(--color-text-hint)] hover:text-[var(--color-text-primary)] disabled:opacity-30"
                    >
                      <GripVertical className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-[var(--color-text-primary)]">{btn.label}</span>
                      {!btn.active && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-600">已禁用</span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--color-text-muted)] line-clamp-2">{btn.prompt}</p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditForm(index)}
                      className="p-1.5 rounded-lg text-[var(--color-text-hint)] hover:text-[var(--color-gold)] hover:bg-[var(--color-bg-elevated)] transition-colors"
                      title="编辑"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleActive(index)}
                      className="p-1.5 rounded-lg text-[var(--color-text-hint)] hover:text-[var(--color-gold)] hover:bg-[var(--color-bg-elevated)] transition-colors"
                      title={btn.active ? '禁用' : '启用'}
                    >
                      {btn.active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => deleteButton(index)}
                      className="p-1.5 rounded-lg text-[var(--color-text-hint)] hover:text-[var(--color-primary)] hover:bg-[var(--color-bg-elevated)] transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
