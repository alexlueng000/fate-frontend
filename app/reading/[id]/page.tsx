'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import { api, authHeaders, getJSON, postJSON, getOrder } from '@/app/lib/api';
import { useRouteGuard } from '@/app/lib/useRouteGuard';
import { historyApi } from '@/app/lib/history/api';
import { trySSE } from '@/app/lib/chat/sse';
import type { Msg } from '@/app/lib/chat/types';
import Markdown from '@/app/components/Markdown';
import { MessageList } from '@/app/components/chat/MessageList';
import { InputArea } from '@/app/components/chat/InputArea';
import { ContextDrawer } from '@/app/components/consultation/primitives';
import { ReviewNotes } from '@/app/components/consultation/ReviewNotes';
import type { CareerTaskContext } from '@/app/lib/tasks/career';
import PaymentDialog from '@/app/components/PaymentDialog';
import { startWeChatCheckout, useWeChatPaymentReturn, type WeChatCheckout } from '@/app/lib/wechat-payment';

type Pass = { id: number; order_id: number; conversation_id: number | null; available: boolean; remaining: number; expires_at: string | null; duration_hours: number; reply_limit: number; status: string };
type Product = { code: string; name: string; price_cents: number; duration_hours: number; reply_limit: number; description: string };
const price = (cents: number) => (cents / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ReadingPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const authLoading = useRouteGuard(true, false);
  const [title, setTitle] = useState('围绕这件事，继续聊');
  const [kind, setKind] = useState('bazi');
  const [taskContext, setTaskContext] = useState<CareerTaskContext | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [passes, setPasses] = useState<Pass[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [checkout, setCheckout] = useState<WeChatCheckout | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const [checkoutName, setCheckoutName] = useState('单问题深度解读');
  const abort = useRef<AbortController | null>(null);
  const sendLock = useRef(false);
  const retryRequest = useRef<{ question: string; passId: number; key: string } | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const pageRef = useRef<HTMLElement | null>(null);
  const [awayFromBottom, setAwayFromBottom] = useState(false);
  const followRef = useRef(true);
  const active = passes.find(p => p.id === selected && p.conversation_id === id && p.available);
  useWeChatPaymentReturn(setCheckout, setError);

  const refresh = useCallback(async () => {
    const response = await getJSON<{ passes: Pass[] }>(api(`/consultations/${id}`), { headers: authHeaders() });
    setPasses(response.passes);
    setSelected(current => response.passes.some(p => p.id === current && p.available && p.conversation_id === id)
      ? current : response.passes.find(p => p.available && p.conversation_id === id)?.id ?? null);
  }, [id]);
  const loadHistory = useCallback(async () => {
    const detail = await historyApi.detail(id);
    setTitle(detail.task_context?.title || detail.title); setKind(detail.type);
    setTaskContext(detail.task_context?.taskType === 'career' ? detail.task_context : null);
    setMessages(detail.messages.filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({ role: m.role as Msg['role'], content: m.content, meta: { messageId: m.id } })));
  }, [id]);

  useEffect(() => {
    if (authLoading) return;
    if (!Number.isSafeInteger(id) || id <= 0) { setError('解读记录不存在'); setLoading(false); return; }
    let alive = true;
    Promise.all([refresh(), loadHistory(), getJSON<Product[]>(api('/consultations/catalog/products'), { headers: authHeaders() }).then(data => { if (alive) setProducts(data); })])
      .catch(reason => { if (alive) setError(reason instanceof Error ? reason.message : '暂时无法读取解读'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; abort.current?.abort(); };
  }, [authLoading, id, refresh, loadHistory]);
  useEffect(() => {
    const container = pageRef.current?.closest('main');
    if (!container) return;
    const onScroll = () => {
      followRef.current = container.scrollTop + container.clientHeight >= container.scrollHeight - 220;
      setAwayFromBottom(!followRef.current);
    };
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => { if (sending && followRef.current) endRef.current?.scrollIntoView({ block: 'end' }); }, [messages, sending]);
  useEffect(() => {
    let alive = true;
    setQr(null); setPaid(checkout?.order.status === 'PAID');
    if (checkout?.code_url) QRCode.toDataURL(checkout.code_url, { width: 240, margin: 2 }).then(url => { if (alive) setQr(url); }).catch(() => setError('二维码生成失败，请重新打开支付。'));
    return () => { alive = false; };
  }, [checkout]);
  useEffect(() => {
    if (!checkout || paid) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    let attempts = 0;
    async function poll() {
      try {
        const order = await getOrder(checkout!.order.id);
        if (!alive) return;
        if (order.status === 'PAID') { setPaid(true); await refresh(); return; }
        if (['REFUNDED', 'CLOSED', 'CANCELLED'].includes(order.status)) { setError('此订单已关闭或退款。'); return; }
      } catch { if (alive) setError('暂时无法确认支付状态，可稍后刷新查看。'); }
      if (alive && ++attempts < 120) timer = setTimeout(poll, 2500);
    }
    timer = setTimeout(poll, 1000);
    return () => { alive = false; clearTimeout(timer); };
  }, [checkout, paid, refresh]);

  async function bind(pass: Pass) {
    if (busy) return;
    setBusy(true); setError('');
    try { await postJSON(api(`/consultations/${id}/bind`), { pass_id: pass.id }, { headers: authHeaders() }); await refresh(); setSelected(pass.id); }
    catch (reason) { setError(reason instanceof Error ? reason.message : '权益关联失败'); }
    finally { setBusy(false); }
  }
  async function buy(product: Product) {
    if (busy) return;
    setBusy(true); setError(''); setCheckoutName(product.name);
    try { const response = await startWeChatCheckout(product.code); if (response) setCheckout(response); }
    catch (reason) { setError(reason instanceof Error ? reason.message : '暂时无法创建订单'); }
    finally { setBusy(false); }
  }
  async function send() {
    if (sendLock.current || !input.trim() || !active || input.length > 4000) return;
    const question = input.trim();
    sendLock.current = true; setSending(true); setError(''); setInput(''); followRef.current = true;
    const before = messages;
    setMessages([...before, { role: 'user', content: question }, { role: 'assistant', content: '', streaming: true }]);
    abort.current = new AbortController();
    try {
      let pending = retryRequest.current;
      if (pending && pending.question === question && pending.passId === active.id) {
        try {
          const previous = await getJSON<{ status: string }>(api(`/consultations/${id}/requests/${pending.key}`), { headers: authHeaders() });
          if (['FAILED', 'EXPIRED'].includes(previous.status)) pending = null;
        } catch { /* Keep the same key if the outcome cannot be verified. */ }
      } else pending = null;
      pending ??= { question, passId: active.id, key: crypto.randomUUID() };
      retryRequest.current = pending;
      await trySSE(api(`/consultations/${id}/messages`), { pass_id: active.id, request_key: pending.key, message: question },
        content => setMessages([...before, { role: 'user', content: question }, { role: 'assistant', content, streaming: true }]), undefined,
        { signal: abort.current.signal, requireDone: true });
      retryRequest.current = null;
      await loadHistory();
    } catch (reason) {
      setError(abort.current.signal.aborted ? '已停止接收。请刷新确认是否已保存，再决定是否重试。' : reason instanceof Error ? reason.message : '解读未完成，请重试。');
      setInput(question);
      await loadHistory().catch(() => setMessages(before));
    } finally { sendLock.current = false; setSending(false); await refresh().catch(() => {}); }
  }
  return <article ref={pageRef} className="consult-page">
    <Link className="inline-flex min-h-11 items-center text-sm underline underline-offset-4" href="/history">返回解读记录</Link>
    <p className="consult-eyebrow mt-6">单问题深度解读</p><h1>{title}</h1>
    <p className="mt-4 mb-6 text-sm leading-7 text-[var(--color-text-secondary)]">这份权益只用于当前问题。更换主题请开始新的解读。历史内容在到期后仍可查看。</p>
    {loading ? <p role="status">正在读取原问题与解读权益…</p> : <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-[var(--color-border)] py-4">
        <p className="text-sm">{active ? `剩余 ${active.remaining} 次成功回复 · 有效至 ${new Date(active.expires_at!).toLocaleString('zh-CN', { hour12: false })}` : '选择一份权益用于这个问题'}</p>
        <ContextDrawer title="当前问题的解读权益" description="单问题权益与原有次数独立，不会同时扣除。" trigger={<button className="consult-secondary">查看权益与购买</button>}>
          <div className="space-y-5">{passes.map(pass => <section key={pass.id} className="border-b border-[var(--color-border)] pb-5">
            <p>订单 #{pass.order_id} · {pass.conversation_id ? '当前问题' : '尚未选择问题'}</p><p className="my-2 text-sm">剩余 {pass.remaining} 次 · {pass.available ? '可用' : pass.status === 'REVOKED' ? '已撤销' : '已到期或用完'}</p>
            {pass.available && <button disabled={busy} className="consult-secondary" onClick={() => pass.conversation_id ? setSelected(pass.id) : void bind(pass)}>{pass.conversation_id ? '选择这份权益' : '确认用于当前问题'}</button>}
          </section>)}</div>
          <div className="mt-7 space-y-6">{products.map(product => <section key={product.code}><h3 className="font-serif text-lg">{product.name}</h3><p className="my-3 text-2xl">¥{price(product.price_cents)}</p><p className="text-sm leading-7">一个问题，支付成功起 {product.duration_hours} 小时内，包含 {product.reply_limit} 次成功回复。失败不扣次数，到期保留记录。购买后需要确认用于当前问题。</p><button disabled={busy} className="consult-primary mt-4" onClick={() => void buy(product)}>{busy ? '正在处理…' : '购买这份解读'}</button></section>)}{!products.length && <p className="text-sm">目前没有上架的单问题解读商品。</p>}</div>
          <Link href={`${kind === 'liuyao' ? '/liuyao' : '/chat'}?conv_id=${id}`} className="mt-6 inline-block min-h-11 text-sm underline">返回普通对话，使用原有次数</Link>
        </ContextDrawer>
      </div>
      <MessageList messages={messages} Markdown={Markdown} loading={sending} onQuestionClick={setInput} containerClassName="bg-transparent" emptyTitle="原问题已准备好" emptyDescription="选择权益后，可以围绕同一问题继续深入。" />
      <div ref={endRef} style={{ scrollMarginBottom: 260 }} />
      {taskContext && <ReviewNotes conversationId={id} context={taskContext} />}
      <div className="sticky bottom-0 border-t border-[var(--color-border)] bg-[var(--color-bg)] py-4">
        {awayFromBottom && <button className="mb-2 min-h-11 text-sm underline" onClick={() => { followRef.current = true; endRef.current?.scrollIntoView({ block: 'end' }); }}>回到最新回复</button>}
        {error && <p role="alert" className="mb-3 text-sm leading-6 text-[var(--color-primary)]">{error}</p>}
        <InputArea value={input} onChange={setInput} canSend={Boolean(active && input.trim())} sending={sending} disabled={!active && !sending} onSend={() => void send()} onRegenerate={() => {}} onStop={() => abort.current?.abort()} showRegenerate={false} showClear={false} maxLength={4000} placeholder={active ? '继续聊聊这个问题…' : '请先选择当前问题的解读权益'} />
        <button className="mt-2 min-h-11 text-sm underline" disabled={sending} onClick={() => { setError(''); void Promise.all([loadHistory(), refresh()]).catch(e => setError(String(e))); }}>刷新记录与权益</button>
      </div>
    </>}
    {loading && error && <p role="alert">{error}</p>}
    {checkout && <PaymentDialog checkout={checkout} productName={checkoutName} qrDataUrl={qr} error={error || null} onClose={() => setCheckout(null)} onComplete={() => { setCheckout(null); void refresh().catch(e => setError(String(e))); }} success={paid ? { title: '支付已确认', description: '请在权益面板确认将本次解读用于当前问题。', actionLabel: '返回选择权益' } : undefined} />}
  </article>;
}
