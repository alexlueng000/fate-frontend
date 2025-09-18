'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/app/lib/api'; // 改成你项目里的路径

type Me = { id: number; username?: string; is_admin?: boolean };
type QuickButton = { label: string; prompt: string; order: number; active: boolean };
type ConfigResp = { key: string; version: number; value_json: any };

function parseValue(v: any): any {
  if (!v) return {};
  if (typeof v === 'string') {
    try {
      return JSON.parse(v);
    } catch {
      return {};
    }
  }
  return v;
}

async function getConfig(): Promise<ConfigResp> {
  const resp = await fetch(api('/admin/config?key=quick_buttons'), {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });
  if (!resp.ok) throw new Error(await resp.text());
  return await resp.json();
}

async function saveConfig(value_json: any, comment?: string) {
  const resp = await fetch(api('/admin/config/save'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ key: 'quick_buttons', value_json, comment }),
  });
  if (!resp.ok) throw new Error(await resp.text());
  return await resp.json();
}

export default function QuickButtonsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [me, setMe] = useState<Me | null>(null);

  const [version, setVersion] = useState(1);
  const [items, setItems] = useState<QuickButton[]>([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('me');
      if (!raw) {
        router.push('/login?redirect=/admin/config/quick_buttons');
        return;
      }
      const u = JSON.parse(raw) as Me;
      if (!u?.is_admin) {
        router.push('/login?redirect=/admin/config/quick_buttons');
        return;
      }
      setMe(u);
    } catch {
      router.push('/login?redirect=/admin/config/quick_buttons');
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const cfg = await getConfig();
        const parsed = parseValue(cfg.value_json);
        setVersion(cfg.version);
        setItems(parsed.items ?? []);
      } catch (e: any) {
        setMsg(e?.message || '加载失败');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  function update(idx: number, patch: Partial<QuickButton>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  async function onSave() {
    setBusy(true);
    setMsg('');
    try {
      const res = await saveConfig({ items }, 'update quick_buttons');
      setVersion(res.version);
      setMsg('已保存 ✅');
    } catch (e: any) {
      setMsg(e?.message || '保存失败');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <main className="min-h-screen flex items-center justify-center bg-[#fff7e8]">加载中…</main>;
  }

  return (
    <main className="min-h-screen flex flex-col bg-[#fff7e8] text-neutral-800">
      {/* Header */}
      <header className="p-4 border-b border-[#f0d9a6]">
        <h1 className="text-xl font-bold text-[#a83232]">快捷按钮 (v{version})</h1>
      </header>

      {msg && <div className="p-4 text-sm text-[#4a2c2a]">{msg}</div>}

      {/* 内容 */}
      <section className="flex-1 p-4 grid md:grid-cols-2 gap-4 overflow-y-auto">
        {items.map((it, idx) => (
          <div key={idx} className="border rounded-lg p-3 bg-white">
            <input
              value={it.label}
              onChange={(e) => update(idx, { label: e.target.value })}
              placeholder="标签"
              className="w-full border-b p-1 mb-2"
            />
            <textarea
              value={it.prompt}
              onChange={(e) => update(idx, { prompt: e.target.value })}
              placeholder="提示词"
              className="w-full h-32 border p-2 font-mono"
            />
          </div>
        ))}
      </section>

      {/* 底部保存条 */}
      <footer className="sticky bottom-0 bg-[#fff7e8]/90 backdrop-blur border-t border-[#f0d9a6] p-4 flex justify-end">
        <button
          onClick={onSave}
          disabled={busy}
          className="px-6 py-2 bg-[#a83232] text-white rounded-lg shadow hover:bg-[#822727] disabled:opacity-60"
        >
          {busy ? '保存中…' : '保存修改'}
        </button>
      </footer>
    </main>
  );
}
