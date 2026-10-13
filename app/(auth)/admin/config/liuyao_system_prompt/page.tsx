'use client';
import { Button as UiButton, Input as UiInput, Modal as UiModal, Textarea as UiTextarea } from '@/app/components/ui';


import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/app/lib/api';

const CONFIG_KEY = 'liuyao_system_prompt';

type Me = { id: number; username?: string; is_admin?: boolean };
type PromptConfigValue = { content?: string; notes?: string };
type ConfigResp = { key: string; version: number; value_json: unknown };
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

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function parseValue(v: unknown): PromptConfigValue {
  if (!v) return {};
  if (typeof v === 'string') {
    try {
      const parsed: unknown = JSON.parse(v);
      return parseValue(parsed);
    } catch {
      return {};
    }
  }
  if (typeof v !== 'object' || v === null) return {};
  const record = v as Record<string, unknown>;
  return {
    content: typeof record.content === 'string' ? record.content : '',
    notes: typeof record.notes === 'string' ? record.notes : '',
  };
}

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  if (typeof window === 'undefined') return extra ?? {};
  const token = localStorage.getItem('auth_token');
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function getConfig(key: string): Promise<ConfigResp> {
  const resp = await fetch(api(`/admin/config?key=${encodeURIComponent(key)}`), {
    method: 'GET',
    headers: authHeaders(),
    credentials: 'include',
    cache: 'no-store',
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new HttpError(resp.status, `加载失败（HTTP ${resp.status}）：${text || '服务器返回错误'}`);
  }
  return resp.json();
}

async function getRevisions(key: string, limit = 50): Promise<Revision[]> {
  const resp = await fetch(api(`/admin/config/revisions?key=${encodeURIComponent(key)}&limit=${limit}`), {
    method: 'GET',
    headers: authHeaders(),
    credentials: 'include',
    cache: 'no-store',
  });
  if (!resp.ok) return [];
  return resp.json();
}

async function getRevisionDetail(key: string, version: number): Promise<RevisionDetail> {
  const resp = await fetch(api(`/admin/config/revision?key=${encodeURIComponent(key)}&version=${version}`), {
    method: 'GET',
    headers: authHeaders(),
    credentials: 'include',
    cache: 'no-store',
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`加载失败（HTTP ${resp.status}）：${text}`);
  }
  return resp.json();
}

async function saveConfig(key: string, value_json: PromptConfigValue, comment?: string): Promise<SaveResp> {
  const resp = await fetch(api('/admin/config/save'), {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    credentials: 'include',
    cache: 'no-store',
    body: JSON.stringify({ key, value_json, comment }),
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`保存失败（HTTP ${resp.status}）：${text}`);
  }
  return resp.json();
}

async function rollbackConfig(key: string, version: number, comment?: string): Promise<SaveResp> {
  const resp = await fetch(api('/admin/config/rollback'), {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    credentials: 'include',
    cache: 'no-store',
    body: JSON.stringify({ key, version, comment }),
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`回滚失败（HTTP ${resp.status}）：${text}`);
  }
  return resp.json();
}

export default function LiuyaoSystemPromptPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [me, setMe] = useState<Me | null>(null);

  const [version, setVersion] = useState(1);
  const [content, setContent] = useState('');
  const [notes, setNotes] = useState('');
  const [msg, setMsg] = useState('');
  const [revs, setRevs] = useState<Revision[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const [okOpen, setOkOpen] = useState(false);
  const [okInfo, setOkInfo] = useState<SaveResp | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRev, setDetailRev] = useState<RevisionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('me');
      if (!raw) { router.push(`/login?redirect=/admin/config/${CONFIG_KEY}`); return; }
      const u = JSON.parse(raw) as Me;
      if (!u?.is_admin) { router.push(`/login?redirect=/admin/config/${CONFIG_KEY}`); return; }
      setMe(u);
    } catch {
      router.push(`/login?redirect=/admin/config/${CONFIG_KEY}`);
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const cfg = await getConfig(CONFIG_KEY);
        setVersion(cfg.version);
        const parsed = parseValue(cfg.value_json);
        setContent(parsed.content ?? '');
        setNotes(parsed.notes ?? '');
        setRevs(await getRevisions(CONFIG_KEY));
      } catch (e: unknown) {
        setContent('');
        setNotes('');
        if (e instanceof HttpError && e.status === 404) {
          setMsg('尚未配置六爻提示词，可在此创建首个版本（保存后立即生效，不需重启）。');
        } else {
          setMsg(e instanceof Error ? e.message : '加载失败');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const charCount = useMemo(() => content.length, [content]);

  async function onSave() {
    setBusy(true); setMsg('');
    try {
      const res = await saveConfig(CONFIG_KEY, { content, notes }, `update ${CONFIG_KEY}`);
      setVersion(res.version);
      const fresh = await getConfig(CONFIG_KEY);
      const parsed = parseValue(fresh.value_json);
      setContent(parsed.content ?? '');
      setNotes(parsed.notes ?? '');
      setRevs(await getRevisions(CONFIG_KEY));
      setOkInfo(res);
      setOkOpen(true);
      setTimeout(() => setOkOpen(false), 2500);
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : '保存失败');
    } finally { setBusy(false); }
  }

  async function onRollback(v: number) {
    if (!confirm(`回滚到 v${v} ?`)) return;
    setBusy(true); setMsg('');
    try {
      const res = await rollbackConfig(CONFIG_KEY, v, `rollback to v${v}`);
      const fresh = await getConfig(CONFIG_KEY);
      setVersion(fresh.version);
      const parsed = parseValue(fresh.value_json);
      setContent(parsed.content ?? '');
      setNotes(parsed.notes ?? '');
      setRevs(await getRevisions(CONFIG_KEY));
      setOkInfo(res);
      setOkOpen(true);
      setTimeout(() => setOkOpen(false), 2500);
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : '回滚失败');
    } finally { setBusy(false); }
  }

  async function onViewDetail(v: number) {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      setDetailRev(await getRevisionDetail(CONFIG_KEY, v));
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : '加载版本详情失败');
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetail() { setDetailOpen(false); setDetailRev(null); }

  if (loading) {
    return <main className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] text-[var(--color-text-primary)]">加载中…</main>;
  }

  return (
    <main className="prompt-config-page min-h-screen bg-[var(--color-bg)] text-neutral-800">
      <header className="sticky top-20 z-10 backdrop-blur bg-[var(--color-bg)]/80 border-b border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <h1 className="text-xl md:text-2xl font-bold text-[var(--color-primary)]">六爻提示词</h1>
          <span className="text-sm text-[var(--color-text-primary)]">Key: {CONFIG_KEY} · v{version}</span>
          <span className="ml-auto text-sm text-[var(--color-text-primary)]">管理员：{me?.username ?? me?.id}</span>
          <UiButton variant="plain"
            onClick={() => setShowHistory(s => !s)}
            className="ml-2 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-white hover:bg-[var(--color-bg-hover)]"
          >
            历史版本
          </UiButton>
        </div>
        {msg && <div className="max-w-6xl mx-auto px-4 pb-3 text-sm text-[var(--color-text-primary)]">{msg}</div>}
      </header>

      <section className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-[var(--color-border)] bg-white/90 p-3 flex flex-col">
          <div className="flex items-center justify-between mb-2 gap-2">
            <div className="text-[var(--color-text-primary)] text-sm">编辑 · 字数 {charCount}</div>
            <UiInput
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="ml-2 w-full md:max-w-[50%] rounded-lg border border-[var(--color-border)] p-2"
              placeholder="备注（可选）"
            />
          </div>
          <UiTextarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 min-h-[60vh] md:min-h-[70vh] max-h-[75vh] leading-relaxed font-mono text-[14px] rounded-xl border border-[var(--color-border)] p-4 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            placeholder={`# 角色\n你是一位精通《易经》六爻的分析师...\n\n# 风格\n- 理性、克制\n- 略带锋芒\n- 不神叨、不空话\n\n注意：『本次卦象』『知识库摘录』『输出规范』 三块由后端自动追加，不需要写在这里。`}
            spellCheck={false}
          />
          <div className="mt-3 flex justify-end">
            <UiButton variant="plain"
              onClick={onSave}
              disabled={busy}
              className="px-5 py-2 rounded-xl bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
            >
              {busy ? '保存中…' : '保存为新版本'}
            </UiButton>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-white/90 p-3 flex flex-col">
          <div className="mb-2 text-[var(--color-text-primary)] text-sm">预览</div>
          <div className="relative flex-1 min-h-[60vh] md:min-h-[70vh] max-h-[75vh]">
            <div className="absolute inset-0 overflow-y-auto overflow-x-hidden rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] p-4">
              <pre className="whitespace-pre-wrap break-words break-all font-mono text-[14px]">
{content}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {showHistory && (
        <aside className="fixed right-4 bottom-4 top-20 z-20 w-[320px] rounded-2xl border border-[var(--color-border)] bg-white/95 shadow-lg">
          <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between">
            <span className="font-semibold text-[var(--color-text-primary)]">历史版本</span>
            <UiButton variant="plain" onClick={() => setShowHistory(false)} className="text-sm px-2 py-1 rounded border">关闭</UiButton>
          </div>
          <div className="max-h-[75vh] overflow-y-auto divide-y divide-[var(--color-border)]">
            {revs.map(r => (
              <div key={r.version} className="px-4 py-3 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <div className="font-medium text-[var(--color-text-primary)]">v{r.version}</div>
                    <div className="text-xs text-neutral-500">{new Date(r.created_at).toLocaleString()}</div>
                    {r.comment && <div className="text-xs text-neutral-600 mt-1">备注：{r.comment}</div>}
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <UiButton variant="plain"
                    onClick={() => onViewDetail(r.version)}
                    className="px-3 py-1.5 rounded-lg bg-[var(--color-primary)] text-white border border-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]"
                  >
                    查看
                  </UiButton>
                  <UiButton variant="plain"
                    onClick={() => onRollback(r.version)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]"
                  >
                    回滚
                  </UiButton>
                </div>
              </div>
            ))}
            {revs.length === 0 && <div className="px-4 py-6 text-center text-neutral-500">暂无历史</div>}
          </div>
        </aside>
      )}

      {detailOpen && (
        <UiModal open bare onClose={closeDetail} title="历史版本详情" size="wide">
          <div className="w-full max-w-4xl max-h-[85vh] rounded-2xl bg-white shadow-xl border border-[var(--color-border)] flex flex-col">
            <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                历史版本详情
                {detailRev && <span className="ml-2 text-sm font-normal text-neutral-500">v{detailRev.version}</span>}
              </h3>
              <UiButton variant="plain" onClick={closeDetail} className="text-sm px-3 py-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]">关闭</UiButton>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {detailLoading ? (
                <div className="flex items-center justify-center py-12 text-[var(--color-text-primary)]">加载中…</div>
              ) : detailRev ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="rounded-xl bg-[var(--color-bg-card)] p-3 border border-[var(--color-border)]">
                      <div className="text-neutral-500 text-xs mb-1">版本号</div>
                      <div className="font-medium text-[var(--color-text-primary)]">v{detailRev.version}</div>
                    </div>
                    <div className="rounded-xl bg-[var(--color-bg-card)] p-3 border border-[var(--color-border)]">
                      <div className="text-neutral-500 text-xs mb-1">创建时间</div>
                      <div className="font-medium text-[var(--color-text-primary)]">{new Date(detailRev.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                  {detailRev.comment && (
                    <div className="rounded-xl bg-[var(--color-bg-card)] p-3 border border-[var(--color-border)]">
                      <div className="text-neutral-500 text-xs mb-1">操作备注</div>
                      <div className="text-sm text-[var(--color-text-primary)]">{detailRev.comment}</div>
                    </div>
                  )}
                  {detailRev.value_json.notes && (
                    <div className="rounded-xl bg-[var(--color-bg-card)] p-3 border border-[var(--color-border)]">
                      <div className="text-neutral-500 text-xs mb-1">内容备注</div>
                      <div className="text-sm text-[var(--color-text-primary)]">{detailRev.value_json.notes}</div>
                    </div>
                  )}
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
                    <div className="text-[var(--color-text-primary)] text-sm font-medium mb-2">提示词内容</div>
                    <div className="max-h-[50vh] overflow-y-auto rounded-xl bg-white border border-[var(--color-border)] p-4">
                      <pre className="whitespace-pre-wrap break-words font-mono text-[13px] text-[var(--color-text-primary)]">
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
            <div className="px-5 py-3 border-t border-[var(--color-border)] flex justify-between">
              <UiButton variant="plain"
                onClick={closeDetail}
                className="px-4 py-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-primary)]"
              >
                关闭
              </UiButton>
              {detailRev && (
                <UiButton variant="plain"
                  onClick={() => { closeDetail(); onRollback(detailRev.version); }}
                  className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]"
                >
                  回滚到此版本
                </UiButton>
              )}
            </div>
          </div>
        </UiModal>
      )}

      {okOpen && okInfo && (
        <UiModal open bare onClose={() => setOkOpen(false)} title="保存成功" size="md">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-[var(--color-border)]">
            <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">保存成功</h3>
              <UiButton variant="plain" onClick={() => setOkOpen(false)} className="px-2 py-1 rounded hover:bg-neutral-100">✕</UiButton>
            </div>
            <div className="px-5 py-4 text-sm text-[var(--color-text-primary)] space-y-2">
              <p>配置已更新（key: <span className="font-mono">{okInfo.key}</span>，version: <span className="font-mono">v{okInfo.version}</span>）。</p>
              <p>已触发缓存失效，配置将在数秒内生效。</p>
            </div>
            <div className="px-5 py-3 border-t border-[var(--color-border)] flex justify-end">
              <UiButton variant="plain" onClick={() => setOkOpen(false)} className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]">
                我知道了
              </UiButton>
            </div>
          </div>
        </UiModal>
      )}
    </main>
  );
}
