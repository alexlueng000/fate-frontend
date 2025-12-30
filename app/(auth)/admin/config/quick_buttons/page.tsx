'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/app/lib/api'; // 按你的项目路径

type KBFile = {
  filename: string;
  size: number;
  mtime: number;     // epoch seconds
  md5?: string;
};

type IndexMeta = {
  backend: 'st' | 'tfidf' | string;
  model?: string;
  chunk_size: number;
  overlap: number;
  num_chunks: number;
  num_files: number;
  files: string[];
  last_build?: string;
  mode?: string;
};

type QueryResult = {
  rank: number;
  file: string;
  chunk_id: number;
  score: number;
  text: string;
};

export default function KBAdminPage() {
  const router = useRouter();

  // 文件
  const [files, setFiles] = useState<KBFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  // 索引 meta
  const [meta, setMeta] = useState<IndexMeta | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(false);

  // 交互状态
  const [uploading, setUploading] = useState(false);
  const [reindexing, setReindexing] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [toast, setToast] = useState<string>('');

  // 重建参数
  const [mode, setMode] = useState<'auto' | 'full'>('auto');
  const [backend, setBackend] = useState<'st' | 'tfidf' | ''>(''); // '' 表示自动
  const [chunkSize, setChunkSize] = useState(700);
  const [overlap, setOverlap] = useState(120);

  // 检索测试
  const [q, setQ] = useState('');
  const [k, setK] = useState(5);
  const [querying, setQuerying] = useState(false);
  const [results, setResults] = useState<QueryResult[]>([]);

  // ----------- 通用 fetch（走你项目的 api() 前缀）-----------
  const fetchJSON = async <T,>(path: string, init?: RequestInit): Promise<T> => {
    const res = await fetch(api(path), {
      credentials: 'include',
      cache: 'no-store',
      ...init,
    });
    const text = await res.text();
    let data: any = null;
    try { data = text ? JSON.parse(text) : {}; } catch {}
    if (!res.ok) {
      const msg = (data && (data.detail || data.message)) || text || `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return data as T;
  };

  // ----------- 加载数据 -----------
  const loadFiles = async () => {
    setLoadingFiles(true);
    setErrMsg(null);
    try {
      const data = await fetchJSON<{ files: KBFile[] }>('/kb/files');
      setFiles(data.files || []);
    } catch (e: any) {
      setErrMsg(e.message ?? String(e));
    } finally {
      setLoadingFiles(false);
    }
  };

  const loadMeta = async () => {
    setLoadingMeta(true);
    try {
      const data = await fetchJSON<{ ok?: boolean; meta: IndexMeta }>('/kb/index/meta');
      setMeta(data.meta);
    } catch (e: any) {
      // 索引不存在不算致命
      setMeta(null);
      if (!String(e.message).includes('404')) setErrMsg(e.message ?? String(e));
    } finally {
      setLoadingMeta(false);
    }
  };

  useEffect(() => {
    void loadFiles();
    void loadMeta();
  }, []);

  // ----------- 工具 -----------
  const humanSize = (n: number) => {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
    return `${(n / 1024 / 1024 / 1024).toFixed(1)} GB`;
  };
  const timeStr = (t: number) => {
    try { return new Date(t * 1000).toLocaleString(); } catch { return String(t); }
  };

  // ----------- 上传 -----------
  const onUpload = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErrMsg(null);
    setToast('');
    try {
      const fd = new FormData();
      fd.append('f', file); // 后端接收字段名为 f
      await fetchJSON('/kb/files/upload', { method: 'POST', body: fd });
      await loadFiles();
      setToast('上传成功 ✅');
    } catch (e: any) {
      setErrMsg(e.message ?? String(e));
    } finally {
      setUploading(false);
      ev.target.value = '';
    }
  };

  // ----------- 删除 -----------
  const onDelete = async (name: string) => {
    if (!confirm(`确认删除 ${name} ？`)) return;
    setErrMsg(null);
    setToast('');
    try {
      await fetchJSON(`/kb/files/${encodeURIComponent(name)}`, { method: 'DELETE' });
      await loadFiles();
      setToast('已删除 ✅');
    } catch (e: any) {
      setErrMsg(e.message ?? String(e));
    }
  };

  // ----------- 重建索引 -----------
  const onReindex = async () => {
    setReindexing(true);
    setErrMsg(null);
    setToast('');
    try {
      const body = {
        mode,
        backend: backend || null,
        chunk_size: Number(chunkSize) || 700,
        overlap: Number(overlap) || 120,
      };
      await fetchJSON('/kb/reindex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      await loadMeta();
      setToast('索引已重建 ✅');
    } catch (e: any) {
      setErrMsg(e.message ?? String(e));
    } finally {
      setReindexing(false);
    }
  };

  // ----------- 查询 -----------
  const onQuery = async () => {
    if (!q.trim()) return;
    setQuerying(true);
    setErrMsg(null);
    setToast('');
    setResults([]);
    try {
      const data = await fetchJSON<{ ok?: boolean; results: QueryResult[] }>('/kb/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q, k: Math.max(1, Number(k) || 5) }),
      });
      setResults(data.results || []);
    } catch (e: any) {
      setErrMsg(e.message ?? String(e));
    } finally {
      setQuerying(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-[#fff7e8] text-neutral-800">
      {/* Header */}
      <header className="p-4 border-b border-[#f0d9a6]">
        <h1 className="text-xl font-bold text-[#a83232]">知识库管理</h1>
      </header>

      {/* 轻提示 & 错误 */}
      {toast && <div className="p-3 text-sm text-[#4a2c2a]">{toast}</div>}
      {errMsg && (
        <div className="mx-4 rounded-md border border-[#f0d9a6] bg-white/80 px-3 py-2 text-[#a83232]">
          {errMsg}
        </div>
      )}

      <section className="flex-1 p-4 space-y-8 overflow-y-auto">
        {/* 文件列表 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#a83232]">文件列表</h2>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#f0d9a6] bg-white px-3 py-2 text-sm shadow-sm hover:bg-[#fff2cf]">
              <input type="file" className="hidden" onChange={onUpload} accept=".txt,.doc,.docx" />
              {uploading ? '上传中…' : '上传文件'}
            </label>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#f0d9a6] bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-[#fff2cf]">
                <tr>
                  <th className="px-3 py-2 text-left">文件名</th>
                  <th className="px-3 py-2 text-left">大小</th>
                  <th className="px-3 py-2 text-left">修改时间</th>
                  <th className="px-3 py-2 text-left">MD5</th>
                  <th className="px-3 py-2 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {loadingFiles ? (
                  <tr><td className="px-3 py-4" colSpan={5}>加载中...</td></tr>
                ) : files.length === 0 ? (
                  <tr><td className="px-3 py-6 text-gray-600" colSpan={5}>暂无文件</td></tr>
                ) : (
                  files.map(f => (
                    <tr key={f.filename} className="border-t border-[#f0d9a6]">
                      <td className="px-3 py-2 font-medium">{f.filename}</td>
                      <td className="px-3 py-2">{humanSize(f.size)}</td>
                      <td className="px-3 py-2">{timeStr(f.mtime)}</td>
                      <td className="px-3 py-2 font-mono text-xs break-all">{f.md5 || '-'}</td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end">
                          <button
                            className="rounded-lg border border-[#a83232] px-3 py-1 text-[#a83232] hover:bg-[#f0d9a6]"
                            onClick={() => onDelete(f.filename)}
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 索引控制 */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-[#a83232]">索引控制</h2>

          <div className="grid grid-cols-1 gap-4 rounded-xl border border-[#f0d9a6] bg-white p-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium">重建模式</label>
              <div className="flex gap-4">
                <label className="inline-flex items-center gap-2">
                  <input type="radio" name="mode" checked={mode === 'auto'} onChange={() => setMode('auto')} />
                  <span>auto（增量）</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="radio" name="mode" checked={mode === 'full'} onChange={() => setMode('full')} />
                  <span>full（全量）</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">向量后端</label>
              <select
                className="w-full rounded-lg border border-[#f0d9a6] bg-white px-3 py-2"
                value={backend}
                onChange={(e) => setBackend(e.target.value as any)}
              >
                <option value="">自动（沿用/优先 ST）</option>
                <option value="st">Sentence-Transformers</option>
                <option value="tfidf">TF-IDF</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">chunk_size</label>
              <input
                type="number"
                className="w-full rounded-lg border border-[#f0d9a6] bg-white px-3 py-2"
                value={chunkSize}
                min={100}
                onChange={(e) => setChunkSize(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">overlap</label>
              <input
                type="number"
                className="w-full rounded-lg border border-[#f0d9a6] bg-white px-3 py-2"
                value={overlap}
                min={0}
                onChange={(e) => setOverlap(Number(e.target.value))}
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-3">
              <button
                className="rounded-xl bg-[#a83232] px-4 py-2 text-white shadow hover:bg-[#822727] disabled:opacity-60"
                onClick={onReindex}
                disabled={reindexing}
              >
                {reindexing ? '重建中…' : '重建索引'}
              </button>
              <button
                className="rounded-xl border border-[#a83232] px-4 py-2 text-[#a83232] shadow hover:bg-[#f0d9a6] disabled:opacity-60"
                onClick={loadMeta}
                disabled={loadingMeta}
              >
                {loadingMeta ? '刷新中…' : '刷新 Meta'}
              </button>
            </div>
          </div>

          {/* Meta 展示 */}
          <div className="rounded-xl border border-[#f0d9a6] bg-white p-4">
            <div className="mb-2 text-sm text-[#4a2c2a]">索引信息</div>
            {meta ? (
              <div className="grid grid-cols-2 gap-y-1 text-sm md:grid-cols-3">
                <div>backend：<b>{meta.backend}</b></div>
                <div>model：<b>{meta.model || '-'}</b></div>
                <div>chunks：<b>{meta.num_chunks}</b></div>
                <div>files：<b>{meta.num_files}</b></div>
                <div>chunk_size：<b>{meta.chunk_size}</b></div>
                <div>overlap：<b>{meta.overlap}</b></div>
                <div className="md:col-span-3">last_build：<b>{meta.last_build || '-'}</b></div>
              </div>
            ) : (
              <div className="text-sm text-gray-600">当前没有索引，请先重建。</div>
            )}
          </div>
        </div>

        {/* 检索测试 */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-[#a83232]">检索测试</h2>
          <div className="space-y-3 rounded-xl border border-[#f0d9a6] bg-white p-4">
            <textarea
              className="w-full rounded-lg border border-[#f0d9a6] bg-white px-3 py-2"
              rows={3}
              placeholder="输入问题…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <div className="flex items-center gap-3">
              <label className="text-sm text-[#4a2c2a]">Top-k</label>
              <input
                type="number"
                className="w-24 rounded-lg border border-[#f0d9a6] bg-white px-3 py-2"
                value={k}
                min={1}
                onChange={(e) => setK(Number(e.target.value))}
              />
              <button
                className="rounded-xl bg-[#a83232] px-4 py-2 text-white shadow hover:bg-[#822727] disabled:opacity-60"
                onClick={onQuery}
                disabled={querying}
              >
                {querying ? '检索中…' : '检索'}
              </button>
            </div>

            <div className="space-y-2">
              {results.length === 0 ? (
                <div className="text-sm text-gray-600">暂无结果</div>
              ) : (
                results.map(r => (
                  <div key={r.rank} className="rounded-lg border border-[#f0d9a6] bg-white p-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="font-medium">{`#${r.rank} ${r.file}`}</div>
                      <div className="font-mono text-xs">score: {r.score.toFixed(4)}</div>
                    </div>
                    <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{r.text}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer 操作条（与 quick_buttons 风格一致） */}
      <footer className="sticky bottom-0 border-t border-[#f0d9a6] bg-[#fff7e8]/90 backdrop-blur p-4 text-right">
        <span className="text-sm text-[#4a2c2a]">管理完成后请及时重建索引以生效</span>
      </footer>
    </main>
  );
}
