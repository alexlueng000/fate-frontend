'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, MessageSquare, RefreshCw, Save } from 'lucide-react';

import { api, postJSON } from '@/app/lib/api';
import { SYSTEM_INTRO } from '@/app/lib/chat/constants';

type ConfigData = {
  key: string;
  version: number;
  value_json: {
    content?: string;
    notes?: string;
  };
};

const CONFIG_KEY = 'bazi_intro';
const DEFAULT_NOTES = '八字页面首次进入时展示的开场白';

export default function BaziIntroPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState(SYSTEM_INTRO);
  const [notes, setNotes] = useState(DEFAULT_NOTES);
  const [version, setVersion] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const charCount = useMemo(() => content.length, [content]);

  const getToken = useCallback(() => {
    return localStorage.getItem('auth_token');
  }, []);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const token = getToken();
      const resp = await fetch(api(`/admin/config?key=${CONFIG_KEY}`), {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        credentials: 'include',
        cache: 'no-store',
      });

      if (!resp.ok) {
        if (resp.status === 404) {
          setContent(SYSTEM_INTRO);
          setNotes(DEFAULT_NOTES);
          setVersion(0);
          setHasChanges(false);
          return;
        }
        throw new Error('加载失败');
      }

      const data: ConfigData = await resp.json();
      setContent(data.value_json?.content || SYSTEM_INTRO);
      setNotes(data.value_json?.notes || DEFAULT_NOTES);
      setVersion(data.version);
      setHasChanges(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('me');
      if (!raw) {
        router.push('/login?redirect=/admin/config/bazi_intro');
        return;
      }
      const user = JSON.parse(raw);
      if (!user || !user.is_admin) {
        router.push('/login?redirect=/admin/config/bazi_intro');
        return;
      }
    } catch {
      router.push('/login?redirect=/admin/config/bazi_intro');
      return;
    }
    loadConfig();
  }, [router, loadConfig]);

  async function saveConfig() {
    if (!content.trim()) {
      setErr('开场白内容不能为空');
      return;
    }

    setSaving(true);
    setErr(null);
    try {
      const token = getToken();
      await postJSON(api('/admin/config/save'), {
        key: CONFIG_KEY,
        value_json: {
          content,
          notes,
        },
        comment: '更新八字页面开场白',
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      await loadConfig();
    } catch (e) {
      setErr(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  }

  function updateContent(value: string) {
    setContent(value);
    setHasChanges(true);
  }

  function updateNotes(value: string) {
    setNotes(value);
    setHasChanges(true);
  }

  function useDefaultIntro() {
    setContent(SYSTEM_INTRO);
    setNotes(DEFAULT_NOTES);
    setHasChanges(true);
  }

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
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          返回管理后台
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded bg-[var(--color-primary)]/10 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-[var(--color-primary)]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
                八字开场白
              </h1>
              <p className="text-sm text-[var(--color-text-muted)]">
                版本 {version || '未配置'} · {charCount} 字
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => loadConfig()} className="btn btn-secondary p-2" title="刷新">
              <RefreshCw className="w-5 h-5" />
            </button>
            <button onClick={useDefaultIntro} className="btn btn-secondary" type="button">
              使用默认文案
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

        {err && (
          <div className="mb-4 rounded border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-4 py-3 text-sm text-[var(--color-primary)]">
            {err}
          </div>
        )}

        {hasChanges && (
          <div className="mb-4 rounded border border-[var(--color-gold)]/40 bg-[var(--color-gold)]/10 px-4 py-3 text-sm text-[var(--color-gold-dark)]">
            有未保存的修改
          </div>
        )}

        <section className="rounded border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 sm:p-6">
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            开场白内容
          </label>
          <textarea
            value={content}
            onChange={(event) => updateContent(event.target.value)}
            className="w-full min-h-[320px] rounded border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 py-3 text-base leading-7 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
            placeholder="输入八字页面首次进入时展示的开场白"
          />

          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mt-5 mb-2">
            备注
          </label>
          <input
            value={notes}
            onChange={(event) => updateNotes(event.target.value)}
            className="w-full rounded border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 py-3 text-base text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
            placeholder="配置备注"
          />

          <p className="mt-4 text-sm leading-6 text-[var(--color-text-muted)]">
            保存后，新进入八字页面且没有本地会话缓存的用户会看到这段开场白。已有会话会继续展示当时保存的内容。
          </p>
        </section>
      </div>
    </main>
  );
}
