'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, ArrowRight, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouteGuard } from '@/app/lib/useRouteGuard';
import { historyApi, type ConversationListItem, type HistoryType, type HistoryClearType } from '@/app/lib/history/api';
import { trackEvent } from '@/app/lib/analytics/track';
import HistoryRecord from './HistoryRecord';
import styles from './history.module.css';

const PAGE_SIZE = 20;
export default function HistoryList() {
  const router = useRouter();
  const loading = useRouteGuard(true, false);
  const [type, setType] = useState<HistoryType>('bazi');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [items, setItems] = useState<ConversationListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [mutating, setMutating] = useState(false);
  const mutationRef = useRef(false);
  const [confirmation, setConfirmation] = useState<{ id?: number; type?: HistoryClearType; title: string } | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (confirmation && dialog && !dialog.open) { dialog.showModal(); cancelRef.current?.focus(); }
    else if (!confirmation && dialog?.open) dialog.close();
  }, [confirmation]);
  useEffect(() => {
    if (loading) return;
    const controller = new AbortController();
    setFetching(true); setError('');
    historyApi.list(type, offset, PAGE_SIZE, search, controller.signal).then((data) => {
      if (controller.signal.aborted) return;
      if (offset > 0 && data.items.length === 0) { setOffset(Math.max(0, offset - PAGE_SIZE)); return; }
      setItems(data.items); setTotal(data.total);
    }).catch((reason) => {
      if (!controller.signal.aborted) { setError(reason instanceof Error ? reason.message : '加载失败'); setItems([]); }
    }).finally(() => { if (!controller.signal.aborted) setFetching(false); });
    return () => controller.abort();
  }, [loading, type, offset, search, revision]);
  useEffect(() => {
    if (!loading) trackEvent('history_view', { payload: { active_tab: type } });
  }, [loading, type]);
  async function remove() {
    if (!confirmation || mutationRef.current) return;
    mutationRef.current = true; setMutating(true); setError('');
    try {
      if (confirmation.id !== undefined) await historyApi.delete(confirmation.id);
      else if (confirmation.type) await historyApi.clear(confirmation.type);
      trackEvent('history_record_deleted', { payload: { type, bulk: confirmation.id === undefined } });
      setConfirmation(null); setRevision((value) => value + 1);
    } catch (reason) { setError(reason instanceof Error ? reason.message : '删除失败'); setConfirmation(null); }
    finally { mutationRef.current = false; setMutating(false); }
  }
  function continueConversation(item: ConversationListItem) {
    trackEvent('conversation_continue_click', { payload: { type, conversation_id: item.id, source: 'history_list' } });
    router.push(`${type === 'bazi' ? '/chat' : '/liuyao'}?conv_id=${item.id}`);
  }
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link href="/dashboard" className={styles.back}><ArrowLeft size={16} aria-hidden="true" />返回命理首页</Link>
        <header className={styles.heading}>
          <div><p className={styles.eyebrow}>把上次的问题，接着聊下去</p><h1>我的解读记录</h1><p>找回当时的困惑与解读，也为今天的思考留一个起点。</p></div>
          <Link className={styles.newLink} href={type === 'bazi' ? '/panel' : '/liuyao'}>开始新的解读<ArrowRight size={16} aria-hidden="true" /></Link>
        </header>
        <div className={styles.toolbar}>
          <nav aria-label="记录类型" className={styles.tabs}>
            {(['bazi', 'liuyao'] as const).map((value) => <button key={value} aria-pressed={type === value} disabled={mutating} onClick={() => { setType(value); setOffset(0); setItems([]); }}>{value === 'bazi' ? '八字解读' : '六爻问事'}</button>)}
          </nav>
          <form className={styles.search} onSubmit={(event) => { event.preventDefault(); setSearch(query.trim()); setOffset(0); }}>
            <label htmlFor="history-search" className="sr-only">搜索解读记录</label>
            <Search size={17} aria-hidden="true" /><input id="history-search" value={query} maxLength={80} onChange={(event) => setQuery(event.target.value)} placeholder="搜索问题、标题或解读内容" /><button type="submit">搜索</button>
          </form>
        </div>
        <div className={styles.listInfo}>
          <p>{fetching || loading ? '正在读取记录…' : error ? '暂时无法读取记录' : `${search ? '找到' : '共'} ${total} 条记录`}{search && <button className={styles.textButton} onClick={() => { setQuery(''); setSearch(''); setOffset(0); }}>清除搜索</button>}</p>
          <details className={styles.bulkMenu}><summary>管理记录</summary><div>
            <button disabled={mutating || loading} onClick={() => setConfirmation({ type, title: `清空全部${type === 'bazi' ? '八字' : '六爻'}记录？` })}>清空{type === 'bazi' ? '八字' : '六爻'}记录</button>
            <button disabled={mutating || loading} onClick={() => setConfirmation({ type: 'all', title: '清空全部八字和六爻记录？' })}>清空全部记录</button>
          </div></details>
        </div>
        {error && <div className={styles.error} role="alert">{error}<button className={styles.textButton} onClick={() => setRevision((value) => value + 1)}>重新加载</button></div>}
        {loading || fetching ? <div className={styles.skeletons} role="status" aria-label="正在加载记录">{[0, 1, 2].map((n) => <div key={n}><span /><span /><span /></div>)}</div>
          : items.length ? <div className={styles.records}>{items.map((item) => <HistoryRecord key={`${type}-${item.id}`} item={item} type={type} disabled={mutating} onContinue={() => continueConversation(item)} onChange={(next) => setItems((rows) => rows.map((row) => row.id === next.id ? next : row))} onDelete={() => setConfirmation({ id: item.id, title: '删除这条解读记录？' })} />)}</div>
          : !error && <section className={styles.empty}><BookOpen size={32} strokeWidth={1.3} aria-hidden="true" /><h2>{search ? '没有找到相关记录' : '这里会留下你的每一次解读'}</h2><p>{search ? '换一个关键词试试，或清除搜索查看全部记录。' : '完成一次解读后，你可以在这里回顾内容，继续追问。'}</p>{!search && <Link className={styles.newLink} href={type === 'bazi' ? '/panel' : '/liuyao'}>开始{type === 'bazi' ? '八字解读' : '六爻问事'}<ArrowRight size={16} aria-hidden="true" /></Link>}</section>}
        {total > PAGE_SIZE && !fetching && !error && <nav className={styles.pagination} aria-label="记录分页"><button disabled={offset === 0} onClick={() => setOffset((value) => Math.max(0, value - PAGE_SIZE))}><ChevronLeft size={16} aria-hidden="true" />上一页</button><span>{Math.floor(offset / PAGE_SIZE) + 1} / {Math.ceil(total / PAGE_SIZE)}</span><button disabled={offset + PAGE_SIZE >= total} onClick={() => setOffset((value) => value + PAGE_SIZE)}>下一页<ChevronRight size={16} aria-hidden="true" /></button></nav>}
        <p className={styles.footnote}>记录仅自己可见。摘要用于回顾，完整解读保留在原对话中。</p>
      </div>
      <dialog ref={dialogRef} className={styles.dialog} aria-labelledby="delete-title" onCancel={(event) => { event.preventDefault(); if (!mutating) setConfirmation(null); }}>
        <h2 id="delete-title">{confirmation?.title}</h2><p>对应的聊天内容与摘要将一并删除，无法恢复。{confirmation?.type && '此操作包含搜索结果以外的记录。'}</p><div><button ref={cancelRef} onClick={() => setConfirmation(null)} disabled={mutating}>保留记录</button><button className={styles.danger} onClick={remove} disabled={mutating}>{mutating ? '正在删除…' : '确认删除'}</button></div>
      </dialog>
    </div>
  );
}
