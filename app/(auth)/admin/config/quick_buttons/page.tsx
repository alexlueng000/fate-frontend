'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Me = { id: number; username?: string; is_admin?: boolean };
type QuickButton = { label: string; prompt: string; order: number; active: boolean };
type ConfigResp = { key: string; version: number; value_json: { items: QuickButton[]; maxCount?: number } };
type Revision = { version: number; created_at: string; comment?: string | null };

async function fetchCfg(): Promise<ConfigResp> {
  const r = await fetch(`/api/admin/config?key=quick_buttons`, { credentials: 'include' });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
async function fetchRevs(): Promise<Revision[]> {
  const r = await fetch(`/api/admin/config/revisions?key=quick_buttons&limit=50`, { credentials: 'include' });
  if (!r.ok) return [];
  return r.json();
}
async function saveCfg(value_json: any, comment?: string) {
  const r = await fetch('/api/admin/config/save', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
    body: JSON.stringify({ key: 'quick_buttons', value_json, comment }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
async function rollbackCfg(version: number, comment?: string) {
  const r = await fetch('/api/admin/config/rollback', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
    body: JSON.stringify({ key: 'quick_buttons', version, comment }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export default function QuickButtonsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [me, setMe] = useState<Me | null>(null);

  const [version, setVersion] = useState(1);
  const [items, setItems] = useState<QuickButton[]>([]);
  const [maxCount, setMaxCount] = useState(12);
  const [msg, setMsg] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('me');
      if (!raw) { router.push('/login?redirect=/admin/config/quick_buttons'); return; }
      const user = JSON.parse(raw) as Me;
      if (!user.is_admin) { router.push('/login?redirect=/admin/config/quick_buttons'); return; }
      setMe(user);
    } catch { router.push('/login?redirect=/admin/config/quick_buttons'); return; }

    (async () => {
      try {
        const cfg = await fetchCfg();
        setVersion(cfg.version);
        setItems((cfg.value_json?.items || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
        setMaxCount(cfg.value_json?.maxCount ?? 12);
      } catch (e: any) {
        setMsg(e?.message || '加载失败');
      } finally { setLoading(false); }
    })();
  }, [router]);

  async function reloadRevs() {
    const data = await fetchRevs();
    setRevs(data);
  }
  const [revs, setRevs] = useState<Revision[]>([]);

  function addRow() {
    setItems(prev => [...prev, { label: '', prompt: '', order: (prev.at(-1)?.order ?? 0) + 10, active: true }]);
  }
  function removeRow(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx));
  }
  function move(idx: number, dir: -1 | 1) {
    setItems(prev => {
      const arr = [...prev];
      const j = idx + dir; if (j < 0 || j >= arr.length) return arr;
      [arr[idx], arr[j]] = [arr[j], arr[idx]];
      return arr.map((it, i) => ({ ...it, order: (i + 1) * 10 }));
    });
  }
  function update(idx: number, patch: Partial<QuickButton>) {
    setItems(prev => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  const activeCount = useMemo(() => items.filter(i => i.active).length, [items]);

  async function onSave() {
    setBusy(true); setMsg('');
    try {
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (!it.label.trim()) throw new Error(`第 ${i + 1} 个：标签为空`);
        if (!it.prompt.trim()) throw new Error(`第 ${i + 1} 个：提示词为空`);
      }
      const res = await saveCfg({ items, maxCount }, 'update quick_buttons');
      setVersion(res.version);
      await reloadRevs();
      setMsg('已保存 ✅');
    } catch (e: any) {
      setMsg(`保存失败：${e?.message || e}`);
    } finally { setBusy(false); }
  }

  async function onRollback(v: number) {
    if (!confirm(`回滚到 v${v} ?`)) return;
    setBusy(true); setMsg('');
    try {
      await rollbackCfg(v, `rollback to v${v}`);
      const cfg = await fetchCfg();
      setVersion(cfg.version);
      setItems((cfg.value_json?.items || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
      setMaxCount(cfg.value_json?.maxCount ?? 12);
      await reloadRevs();
      setMsg(`已回滚到 v${v} ✅`);
    } catch (e: any) {
      setMsg(`回滚失败：${e?.message || e}`);
    } finally { setBusy(false); }
  }

  if (loading) return <main className="min-h-screen flex items-center justify-center bg-[#fff7e8] text-[#4a2c2a]">加载中…</main>;

  return (
    <main className="min-h-screen bg-[#fff7e8] text-neutral-800">
      {/* 顶栏 */}
      <header className="sticky top-0 z-10 backdrop-blur bg-[#fff7e8]/80 border-b border-[#f0d9a6]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <h1 className="text-xl md:text-2xl font-bold text-[#a83232]">快捷按钮</h1>
          <span className="text-sm text-[#4a2c2a]">当前 v{version} · 启用 {activeCount}/{maxCount}</span>
          <span className="ml-auto text-sm text-[#4a2c2a]">管理员：{me?.username ?? me?.id}</span>
          <button
            onClick={async () => { setShowHistory(s => !s); if (!showHistory) await reloadRevs(); }}
            className="ml-2 px-3 py-1.5 rounded-lg border border-[#f0d9a6] bg-white hover:bg-[#fff2d9]"
          >
            历史版本
          </button>
          <button
            onClick={onSave}
            disabled={busy}
            className="px-4 py-2 rounded-xl bg-[#a83232] text-white font-semibold hover:bg-[#822727] disabled:opacity-60"
          >
            {busy ? '保存中…' : '保存为新版本'}
          </button>
        </div>
        {msg && <div className="max-w-6xl mx-auto px-4 pb-3 text-sm text-[#4a2c2a]">{msg}</div>}
      </header>

      {/* 编辑区：卡片列表（自适应高度） */}
      <section className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-4 flex items-center gap-3">
          <button onClick={addRow} className="px-4 py-2 rounded-xl bg-[#4a2c2a] text-white hover:bg-[#2c1b19]">新增一条</button>
          <label className="text-[#4a2c2a] text-sm">显示上限</label>
          <input
            type="number" min={1} max={64} value={maxCount}
            onChange={(e) => setMaxCount(parseInt(e.target.value || '1', 10))}
            className="w-24 rounded-lg border border-[#f0d9a6] p-2"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {items.map((it, idx) => (
            <div key={idx} className="rounded-2xl border border-[#f0d9a6] bg-white/90 p-4">
              <div className="flex items-center justify-between">
                <input
                  value={it.label}
                  onChange={(e) => update(idx, { label: e.target.value })}
                  placeholder="标签"
                  className="text-base md:text-lg font-semibold text-[#4a2c2a] bg-transparent outline-none w-full mr-3"
                />
                <div className="flex items-center gap-2">
                  <button onClick={() => move(idx, -1)} className="px-2 py-1 rounded-lg border">↑</button>
                  <button onClick={() => move(idx, 1)} className="px-2 py-1 rounded-lg border">↓</button>
                  <input type="checkbox" checked={it.active} onChange={(e) => update(idx, { active: e.target.checked })} />
                </div>
              </div>
              <textarea
                value={it.prompt}
                onChange={(e) => update(idx, { prompt: e.target.value })}
                placeholder="按钮对应的提示词"
                className="mt-3 w-full h-[28vh] md:h-[24vh] font-mono text-[14px] leading-relaxed rounded-xl border border-[#f0d9a6] p-3"
                spellCheck={false}
              />
              <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
                <span>顺序 #{it.order}</span>
                <button onClick={() => removeRow(idx)} className="px-3 py-1.5 rounded-lg border">删除</button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#f0d9a6] bg-white/50 p-10 text-center text-neutral-500">
              暂无数据，点击“新增一条”开始配置
            </div>
          )}
        </div>
      </section>

      {/* 历史抽屉 */}
      {showHistory && (
        <aside className="fixed right-4 bottom-4 top-20 z-20 w-[320px] rounded-2xl border border-[#f0d9a6] bg-white/95 shadow-lg">
          <div className="px-4 py-3 border-b border-[#f0d9a6] flex items-center justify-between">
            <span className="font-semibold text-[#4a2c2a]">历史版本</span>
            <button onClick={() => setShowHistory(false)} className="text-sm px-2 py-1 rounded border">关闭</button>
          </div>
          <div className="max-h-[75vh] overflow-y-auto divide-y divide-[#f7e4c6]">
            {revs.map(r => (
              <div key={r.version} className="px-4 py-3 text-sm flex items-center justify-between">
                <div>
                  <div className="font-medium text-[#4a2c2a]">v{r.version}</div>
                  <div className="text-xs text-neutral-500">{new Date(r.created_at).toLocaleString()}</div>
                  {r.comment && <div className="text-xs text-neutral-600 mt-1">备注：{r.comment}</div>}
                </div>
                <button
                  onClick={() => onRollback(r.version)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-[#f0d9a6] hover:bg-[#fff2d9]"
                >
                  回滚
                </button>
              </div>
            ))}
            {revs.length === 0 && <div className="px-4 py-6 text-center text-neutral-500">暂无历史</div>}
          </div>
        </aside>
      )}
    </main>
  );
}
