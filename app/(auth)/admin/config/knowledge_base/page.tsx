'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/app/lib/api';
import {
  ArrowLeft,
  BookOpen,
  RefreshCw,
  Upload,
  Trash2,
  Search,
  Loader2,
} from 'lucide-react';

type KBFile = {
  filename: string;
  size: number;
  mtime: number; // epoch seconds
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
  const [files, setFiles] = useState<KBFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  const [meta, setMeta] = useState<IndexMeta | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [reindexing, setReindexing] = useState(false);

  // reindex form
  const [mode, setMode] = useState<'auto' | 'full'>('auto');
  const [backend, setBackend] = useState<'st' | 'tfidf' | ''>(''); // '' = auto
  const [chunkSize, setChunkSize] = useState(700);
  const [overlap, setOverlap] = useState(120);

  // query
  const [q, setQ] = useState('');
  const [k, setK] = useState(5);
  const [querying, setQuerying] = useState(false);
  const [results, setResults] = useState<QueryResult[]>([]);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [toast, setToast] = useState<string>('');

  const fetchJSON = async <T,>(path: string, init?: RequestInit): Promise<T> => {
    const res = await fetch(api(path), {
      credentials: 'include',
      ...init,
      headers: {
        ...(init?.headers ?? {}),
      },
    });
    const txt = await res.text();
    let data: unknown = null;
    try { data = txt ? JSON.parse(txt) : {}; } catch { /* fallthrough */ }
    if (!res.ok) {
      const msg = (data && typeof data === 'object' && ('detail' in data || 'message' in data))
        ? ((data as Record<string, string>).detail || (data as Record<string, string>).message)
        : txt || `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return data as T;
  };

  const loadFiles = async () => {
    setLoadingFiles(true);
    setErrMsg(null);
    try {
      const data = await fetchJSON<{ files: KBFile[] }>('/kb/files');
      setFiles(data.files || []);
    } catch (e) {
      setErrMsg((e as Error).message ?? String(e));
    } finally {
      setLoadingFiles(false);
    }
  };

  const loadMeta = async () => {
    setLoadingMeta(true);
    setErrMsg(null);
    try {
      const data = await fetchJSON<{ ok?: boolean; meta: IndexMeta }>('/kb/index/meta');
      setMeta(data.meta);
    } catch (e) {
      // 索引可能不存在
      setMeta(null);
      const msg = (e as Error).message ?? String(e);
      // 404 不当成致命错误，仅提示
      if (!/404/.test(msg)) setErrMsg(msg);
    } finally {
      setLoadingMeta(false);
    }
  };

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('me');
      if (!raw) {
        router.push('/login?redirect=/admin/config/knowledge_base');
        return;
      }
      const user = JSON.parse(raw);
      if (!user || !user.is_admin) {
        router.push('/login?redirect=/admin/config/knowledge_base');
        return;
      }
    } catch {
      router.push('/login?redirect=/admin/config/knowledge_base');
      return;
    }
    void loadFiles();
    void loadMeta();
  }, [router]);

  const humanSize = (n: number) => {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
    return `${(n / 1024 / 1024 / 1024).toFixed(1)} GB`;
  };

  const timeStr = (t: number) => {
    try { return new Date(t * 1000).toLocaleString(); } catch { return String(t); }
  };

  // 上传
  const onUpload = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErrMsg(null);
    try {
      const fd = new FormData();
      fd.append('f', file);
      await fetchJSON('/kb/files/upload', {
        method: 'POST',
        body: fd,
      });
      await loadFiles();
    } catch (e: any) {
      setErrMsg(e.message ?? String(e));
    } finally {
      setUploading(false);
      ev.target.value = '';
    }
  };

  // 删除
  const onDelete = async (name: string) => {
    if (!confirm(`确认删除 ${name} ？`)) return;
    setErrMsg(null);
    try {
      await fetchJSON(`/kb/files/${encodeURIComponent(name)}`, { method: 'DELETE' });
      await loadFiles();
    } catch (e: any) {
      setErrMsg(e.message ?? String(e));
    }
  };

  // 重建索引
  const onReindex = async () => {
    setReindexing(true);
    setErrMsg(null);
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
    } catch (e: any) {
      setErrMsg(e.message ?? String(e));
    } finally {
      setReindexing(false);
    }
  };

  // 查询
  const onQuery = async () => {
    if (!q.trim()) return;
    setQuerying(true);
    setErrMsg(null);
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
    <main className="min-h-screen pt-20 pb-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Back Link */}
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回管理后台
        </Link>

        <h1 className="text-2xl font-bold">知识库管理</h1>

      {errMsg && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-red-700">
          {errMsg}
        </div>
      )}

      {/* 文件区 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">文件列表</h2>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm shadow-sm hover:bg-gray-50">
            <input type="file" className="hidden" onChange={onUpload} accept=".txt,.doc,.docx" />
            {uploading ? '上传中…' : '上传文件'}
          </label>
        </div>

        <div className="overflow-hidden rounded-xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
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
                <tr><td className="px-3 py-6 text-gray-500" colSpan={5}>暂无文件</td></tr>
              ) : (
                files.map(f => (
                  <tr key={f.filename} className="border-t">
                    <td className="px-3 py-2 font-medium">{f.filename}</td>
                    <td className="px-3 py-2">{humanSize(f.size)}</td>
                    <td className="px-3 py-2">{timeStr(f.mtime)}</td>
                    <td className="px-3 py-2 font-mono text-xs break-all">{f.md5 || '-'}</td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end">
                        <button
                          className="rounded-lg border px-3 py-1 text-red-600 hover:bg-red-50"
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
      </section>

      {/* 索引控制 */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">索引控制</h2>
        <div className="grid grid-cols-1 gap-3 rounded-xl border p-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-medium">重建模式</label>
            <div className="flex gap-3">
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
              className="w-full rounded-lg border px-3 py-2"
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
              className="w-full rounded-lg border px-3 py-2"
              value={chunkSize}
              min={100}
              onChange={(e) => setChunkSize(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">overlap</label>
            <input
              type="number"
              className="w-full rounded-lg border px-3 py-2"
              value={overlap}
              min={0}
              onChange={(e) => setOverlap(Number(e.target.value))}
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-3">
            <button
              className="rounded-xl border px-4 py-2 shadow-sm hover:bg-gray-50"
              onClick={onReindex}
              disabled={reindexing}
            >
              {reindexing ? '重建中…' : '重建索引'}
            </button>
            <button
              className="rounded-xl border px-4 py-2 shadow-sm hover:bg-gray-50"
              onClick={loadMeta}
              disabled={loadingMeta}
            >
              {loadingMeta ? '刷新中…' : '刷新 Meta'}
            </button>
          </div>
        </div>

        {/* Meta 展示 */}
        <div className="rounded-xl border p-4">
          <div className="mb-2 text-sm text-gray-600">索引信息</div>
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
            <div className="text-sm text-gray-500">当前没有索引，请先重建。</div>
          )}
        </div>
      </section>

      {/* 检索测试 */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">检索测试</h2>
        <div className="rounded-xl border p-4 space-y-3">
          <textarea
            className="w-full rounded-lg border px-3 py-2"
            rows={3}
            placeholder="输入问题…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600">Top-k</label>
            <input
              type="number"
              className="w-24 rounded-lg border px-3 py-2"
              value={k}
              min={1}
              onChange={(e) => setK(Number(e.target.value))}
            />
            <button
              className="rounded-xl border px-4 py-2 shadow-sm hover:bg-gray-50"
              onClick={onQuery}
              disabled={querying}
            >
              {querying ? '检索中…' : '检索'}
            </button>
          </div>

          <div className="space-y-2">
            {results.length === 0 ? (
              <div className="text-sm text-gray-500">暂无结果</div>
            ) : (
              results.map(r => (
                <div key={r.rank} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="font-medium">#{r.rank} {r.file}</div>
                    <div className="font-mono text-xs">score: {r.score.toFixed(4)}</div>
                  </div>
                  <div className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{r.text}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
      </div>
    </main>
  );
}
