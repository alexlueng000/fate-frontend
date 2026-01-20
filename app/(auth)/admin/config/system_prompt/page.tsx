'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/app/lib/api'; // ← 调整为你的实际路径

type Me = { id: number; username?: string; is_admin?: boolean };
type ConfigResp = { key: string; version: number; value_json: any };
type Revision = { version: number; created_at: string; comment?: string | null };
type SaveResp = { ok: boolean; key: string; version: number };
type RevisionDetail = {
  key: string;
  value_json: { content?: string; notes?: string };
  version: number;
  created_at: string;
  editor_id?: number | null;
  comment?: string | null;
};

function parseValue(v: any): any {
  if (!v) return {};
  if (typeof v === 'string') {
    try { return JSON.parse(v); } catch { return {}; }
  }
  return v;
}

async function getConfig(key: string): Promise<ConfigResp> {
  const resp = await fetch(api(`/admin/config?key=${encodeURIComponent(key)}`), {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  }).catch((err: unknown) => {
    throw new Error(`网络错误：${(err as Error)?.message || '可能是 CORS/域名/协议问题'}`);
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`加载失败（HTTP ${resp.status}）：${text || '服务器返回错误'}`);
  }
  const data = await resp.json().catch(() => null);
  if (!data) throw new Error('服务器返回了无效的 JSON');
  return data as ConfigResp;
}

async function getRevisions(key: string, limit = 50): Promise<Revision[]> {
  const resp = await fetch(api(`/admin/config/revisions?key=${encodeURIComponent(key)}&limit=${limit}`), {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  }).catch((err: unknown) => {
    throw new Error(`网络错误：${(err as Error)?.message || '可能是 CORS/域名/协议问题'}`);
  });
  if (!resp.ok) return [];
  const data = await resp.json().catch(() => null);
  return (data || []) as Revision[];
}

async function getRevisionDetail(key: string, version: number): Promise<RevisionDetail> {
  const resp = await fetch(api(`/admin/config/revision?key=${encodeURIComponent(key)}&version=${version}`), {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  }).catch((err: unknown) => {
    throw new Error(`网络错误：${(err as Error)?.message || '可能是 CORS/域名/协议问题'}`);
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`加载失败（HTTP ${resp.status}）：${text || '服务器返回错误'}`);
  }
  const data = await resp.json().catch(() => null);
  if (!data) throw new Error('服务器返回了无效的 JSON');
  return data as RevisionDetail;
}

async function saveConfig(key: string, value_json: any, comment?: string) {
  const resp = await fetch(api('/admin/config/save'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    cache: 'no-store',
    body: JSON.stringify({ key, value_json, comment }),
  }).catch((err: unknown) => {
    throw new Error(`网络错误：${(err as Error)?.message || '可能是 CORS/域名/协议问题'}`);
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`保存失败（HTTP ${resp.status}）：${text || '服务器返回错误'}`);
  }
  const data = await resp.json().catch(() => null);
  if (!data) throw new Error('服务器返回了无效的 JSON');
  return data as SaveResp; // 后端返回 { ok, key, version }
}

async function rollbackConfig(key: string, version: number, comment?: string) {
  const resp = await fetch(api('/admin/config/rollback'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    cache: 'no-store',
    body: JSON.stringify({ key, version, comment }),
  }).catch((err: unknown) => {
    throw new Error(`网络错误：${(err as Error)?.message || '可能是 CORS/域名/协议问题'}`);
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`回滚失败（HTTP ${resp.status}）：${text || '服务器返回错误'}`);
  }
  const data = await resp.json().catch(() => null);
  if (!data) throw new Error('服务器返回了无效的 JSON');
  return data as SaveResp;
}

export default function SystemPromptPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [me, setMe] = useState<Me | null>(null);

  // 优先 system_prompt，不存在则尝试 rprompt
  const [cfgKey, setCfgKey] = useState<'system_prompt' | 'prompt'>('system_prompt');

  const [version, setVersion] = useState(1);
  const [content, setContent] = useState('');
  const [notes, setNotes] = useState('');
  const [msg, setMsg] = useState('');
  const [revs, setRevs] = useState<Revision[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // 成功弹窗
  const [okOpen, setOkOpen] = useState(false);
  const [okInfo, setOkInfo] = useState<SaveResp | null>(null);

  // 历史版本详情弹窗
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRev, setDetailRev] = useState<RevisionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    // 1) sessionStorage 鉴权
    try {
      const raw = sessionStorage.getItem('me');
      if (!raw) { router.push('/login?redirect=/admin/config/system_prompt'); return; }
      const u = JSON.parse(raw) as Me;
      if (!u?.is_admin) { router.push('/login?redirect=/admin/config/system_prompt'); return; }
      setMe(u);
    } catch {
      router.push('/login?redirect=/admin/config/system_prompt');
      return;
    }

    // 2) 加载配置（system_prompt → rprompt 回退）
    (async () => {
      setLoading(true);
      try {
        try {
          const cfg = await getConfig('system_prompt');
          setCfgKey('system_prompt');
          setVersion(cfg.version);
          const parsed = parseValue(cfg.value_json);
          setContent(parsed.content ?? '');
          setNotes(parsed.notes ?? '');
          setRevs(await getRevisions('system_prompt'));
        } catch {
          const cfg = await getConfig('prompt');
          setCfgKey('prompt');
          setVersion(cfg.version);
          const parsed = parseValue(cfg.value_json);
          setContent(parsed.content ?? '');
          setNotes(parsed.notes ?? '');
          setRevs(await getRevisions('prompt'));
        }
      } catch (e: any) {
        setMsg(e?.message || '加载失败');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const charCount = useMemo(() => content.length, [content]);

  async function onSave() {
    setBusy(true); setMsg('');
    try {
      const res = await saveConfig(cfgKey, { content, notes }, `update ${cfgKey}`);
      setVersion(res.version);
      // 保存后强制拉新
      const fresh = await getConfig(cfgKey);
      const parsed = parseValue(fresh.value_json);
      setContent(parsed.content ?? '');
      setNotes(parsed.notes ?? '');
      setRevs(await getRevisions(cfgKey));
      // 弹窗
      setOkInfo(res);
      setOkOpen(true);
      setTimeout(() => setOkOpen(false), 2500);
    } catch (e: any) {
      setMsg(e?.message || '保存失败');
    } finally { setBusy(false); }
  }

  async function onRollback(v: number) {
    if (!confirm(`回滚到 v${v} ?`)) return;
    setBusy(true); setMsg('');
    try {
      const res = await rollbackConfig(cfgKey, v, `rollback to v${v}`);
      const fresh = await getConfig(cfgKey);
      setVersion(fresh.version);
      const parsed = parseValue(fresh.value_json);
      setContent(parsed.content ?? '');
      setNotes(parsed.notes ?? '');
      setRevs(await getRevisions(cfgKey));
      // 弹窗
      setOkInfo(res);
      setOkOpen(true);
      setTimeout(() => setOkOpen(false), 2500);
    } catch (e: any) {
      setMsg(e?.message || '回滚失败');
    } finally { setBusy(false); }
  }

  async function onViewDetail(v: number) {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const detail = await getRevisionDetail(cfgKey, v);
      setDetailRev(detail);
    } catch (e: any) {
      setMsg(e?.message || '加载版本详情失败');
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetail() {
    setDetailOpen(false);
    setDetailRev(null);
  }

  if (loading) {
    return <main className="min-h-screen flex items-center justify-center bg-[#fff7e8] text-[#4a2c2a]">加载中…</main>;
  }

  return (
    <main className="min-h-screen bg-[#fff7e8] text-neutral-800">
      {/* 顶部工具条 */}
      <header className="sticky top-0 z-10 backdrop-blur bg-[#fff7e8]/80 border-b border-[#f0d9a6]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <h1 className="text-xl md:text-2xl font-bold text-[#a83232]">系统提示词</h1>
          <span className="text-sm text-[#4a2c2a]">Key: {cfgKey} · v{version}</span>
          <span className="ml-auto text-sm text-[#4a2c2a]">管理员：{me?.username ?? me?.id}</span>
          <button
            onClick={() => setShowHistory(s => !s)}
            className="ml-2 px-3 py-1.5 rounded-lg border border-[#f0d9a6] bg-white hover:bg-[#fff2d9]"
          >
            历史版本
          </button>
        </div>
        {msg && <div className="max-w-6xl mx-auto px-4 pb-3 text-sm text-[#4a2c2a]">{msg}</div>}
      </header>

      {/* 主体：左右分栏 */}
      <section className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 编辑器 */}
        <div className="rounded-2xl border border-[#f0d9a6] bg-white/90 p-3 flex flex-col">
          <div className="flex items-center justify-between mb-2 gap-2">
            <div className="text-[#4a2c2a] text-sm">编辑（{cfgKey}） · 字数 {charCount}</div>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="ml-2 w-full md:max-w-[50%] rounded-lg border border-[#f0d9a6] p-2"
              placeholder="备注（可选）"
            />
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 min-h-[60vh] md:min-h-[70vh] max-h-[75vh] leading-relaxed font-mono text-[14px] rounded-xl border border-[#f0d9a6] p-4 focus:outline-none focus:ring-2 focus:ring-[#a83232]"
            placeholder="# 角色\n..."
            spellCheck={false}
          />
          <div className="mt-3 flex justify-end">
            <button
              onClick={onSave}
              disabled={busy}
              className="px-5 py-2 rounded-xl bg-[#a83232] text-white font-semibold hover:bg-[#822727] disabled:opacity-60"
            >
              {busy ? '保存中…' : '保存为新版本'}
            </button>
          </div>
        </div>

        {/* 预览（限制高度 + 内部滚动） */}
        <div className="rounded-2xl border border-[#f0d9a6] bg-white/90 p-3 flex flex-col">
          <div className="mb-2 text-[#4a2c2a] text-sm">预览（原样显示 / 可改为 Markdown 渲染）</div>
          <div className="relative flex-1 min-h-[60vh] md:min-h-[70vh] max-h-[75vh]">
            <div className="absolute inset-0 overflow-y-auto overflow-x-hidden rounded-xl bg-[#fff9f0] border border-[#f7e4c6] p-4">
              <pre className="whitespace-pre-wrap break-words break-all font-mono text-[14px]">
{content}
              </pre>
            </div>
          </div>
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
              <div key={r.version} className="px-4 py-3 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <div className="font-medium text-[#4a2c2a]">v{r.version}</div>
                    <div className="text-xs text-neutral-500">{new Date(r.created_at).toLocaleString()}</div>
                    {r.comment && <div className="text-xs text-neutral-600 mt-1">备注：{r.comment}</div>}
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => onViewDetail(r.version)}
                    className="px-3 py-1.5 rounded-lg bg-[#a83232] text-white border border-[#a83232] hover:bg-[#822727]"
                  >
                    查看
                  </button>
                  <button
                    onClick={() => onRollback(r.version)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-[#f0d9a6] hover:bg-[#fff2d9]"
                  >
                    回滚
                  </button>
                </div>
              </div>
            ))}
            {revs.length === 0 && <div className="px-4 py-6 text-center text-neutral-500">暂无历史</div>}
          </div>
        </aside>
      )}

      {/* 历史版本详情弹窗 */}
      {detailOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[85vh] rounded-2xl bg-white shadow-xl border border-[#f0d9a6] flex flex-col">
            <div className="px-5 py-4 border-b border-[#f0d9a6] flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#4a2c2a]">
                历史版本详情
                {detailRev && <span className="ml-2 text-sm font-normal text-neutral-500">v{detailRev.version}</span>}
              </h3>
              <button onClick={closeDetail} className="text-sm px-3 py-1.5 rounded-lg border border-[#f0d9a6] hover:bg-[#fff2d9]">关闭</button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {detailLoading ? (
                <div className="flex items-center justify-center py-12 text-[#4a2c2a]">加载中…</div>
              ) : detailRev ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="rounded-xl bg-[#fff9f0] p-3 border border-[#f7e4c6]">
                      <div className="text-neutral-500 text-xs mb-1">版本号</div>
                      <div className="font-medium text-[#4a2c2a]">v{detailRev.version}</div>
                    </div>
                    <div className="rounded-xl bg-[#fff9f0] p-3 border border-[#f7e4c6]">
                      <div className="text-neutral-500 text-xs mb-1">创建时间</div>
                      <div className="font-medium text-[#4a2c2a]">{new Date(detailRev.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                  {detailRev.comment && (
                    <div className="rounded-xl bg-[#fff9f0] p-3 border border-[#f7e4c6]">
                      <div className="text-neutral-500 text-xs mb-1">操作备注</div>
                      <div className="text-sm text-[#4a2c2a]">{detailRev.comment}</div>
                    </div>
                  )}
                  {detailRev.value_json.notes && (
                    <div className="rounded-xl bg-[#fff9f0] p-3 border border-[#f7e4c6]">
                      <div className="text-neutral-500 text-xs mb-1">内容备注</div>
                      <div className="text-sm text-[#4a2c2a]">{detailRev.value_json.notes}</div>
                    </div>
                  )}
                  <div className="rounded-xl border border-[#f0d9a6] bg-[#fff9f0] p-4">
                    <div className="text-[#4a2c2a] text-sm font-medium mb-2">提示词内容</div>
                    <div className="max-h-[50vh] overflow-y-auto rounded-xl bg-white border border-[#f7e4c6] p-4">
                      <pre className="whitespace-pre-wrap break-words font-mono text-[13px] text-[#4a2c2a]">
                        {detailRev.value_json.content || '(空)'}
                      </pre>
                    </div>
                    <div className="mt-3 text-xs text-neutral-500 text-right">
                      字数：{detailRev.value_json.content?.length || 0}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="px-5 py-3 border-t border-[#f0d9a6] flex justify-between">
              <button
                onClick={closeDetail}
                className="px-4 py-2 rounded-xl border border-[#f0d9a6] hover:bg-[#fff2d9] text-[#4a2c2a]"
              >
                关闭
              </button>
              {detailRev && (
                <button
                  onClick={() => {
                    closeDetail();
                    onRollback(detailRev.version);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#a83232] text-white hover:bg-[#822727]"
                >
                  回滚到此版本
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 成功弹窗 */}
      {okOpen && okInfo && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-[#f0d9a6]">
            <div className="px-5 py-4 border-b border-[#f0d9a6] flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#4a2c2a]">保存成功</h3>
              <button onClick={() => setOkOpen(false)} className="px-2 py-1 rounded hover:bg-neutral-100">✕</button>
            </div>
            <div className="px-5 py-4 text-sm text-[#4a2c2a] space-y-2">
              <p>配置已更新（key: <span className="font-mono">{okInfo.key}</span>，version: <span className="font-mono">v{okInfo.version}</span>）。</p>
              <p>已触发缓存失效，配置将在数秒内生效。</p>
            </div>
            <div className="px-5 py-3 border-t border-[#f0d9a6] flex justify-end">
              <button onClick={() => setOkOpen(false)} className="px-4 py-2 rounded-xl bg-[#a83232] text-white hover:bg-[#822727]">
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
