import { NextRequest, NextResponse } from 'next/server';
import { LOCAL_PREVIEW, previewUser } from '@/app/lib/local-preview/config';
import { previewChart, previewConversations, previewOverview, previewProfile, previewReply, previewReport } from '@/app/lib/local-preview/fixtures';
import { QUICK_BUTTONS } from '@/app/lib/chat/types';

export const dynamic = 'force-dynamic';

const json = (data: unknown, status = 200) => NextResponse.json(data, {
  status, headers: { 'Cache-Control': 'no-store', 'X-Local-Preview': '1' },
});

async function handle(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  // No proxy fallback: even unsupported requests remain local.
  if (!LOCAL_PREVIEW) return NextResponse.json({ detail: 'Not found' }, { status: 404 });
  const path = '/' + ((await context.params).path ?? []).join('/');
  const method = request.method;
  // Fixed archived first report for the isolated UI preview. This is not a
  // generated/saved result and the production guard above is mandatory.
  const previewOpening = { state: 'succeeded', conversation_id: 'bazi_conv_9000', message_id: 2,
    source_hash: 'd'.repeat(64), reply: previewReport, paipan: previewChart, task_context: null, demo: true };
  if ((method === 'POST' && path === '/chat/start/status') || (method === 'GET' && path === '/chat/conversations/bazi_conv_9000/opening')) return json(previewOpening);
  if (method === 'GET') {
    const turn = path.match(/^\/chat\/conversations\/((?:bazi_conv_|liuyao_conv_|conv_)?\d+)\/request$/);
    if (turn) return json({ state: 'idle', conversation_id: turn[1], demo: true });
    if (path === '/me') return json(previewUser);
    if (path === '/profile/me') return json(previewProfile);
    if (path === '/config/quick_buttons') return json(QUICK_BUTTONS);
    if (path === '/config/bazi_intro') return json({ content: '已载入演示命盘。你想先了解自己，还是讨论最近的一件具体事情？发送后将看到固定演示回复。' });
    if (path === '/bazi/today_reminder') return json({ lunar_display: '本地示例', theme: '先整理，再行动', title: '给重要的事情留一点空间', suitable_actions: ['梳理计划', '补充资料', '耐心沟通'], caution_actions: ['冲动承诺', '一次定死'], reminder: '先理清条件，再做选择。', closing_sentence: '把今天最重要的一件事写下来，从小处开始。', basis: '固定演示文案，未运行每日计算' });
    if (path.startsWith('/quota/me')) {
      const quota = (quota_type: string) => ({ quota_type, total: 50, used: 8, remaining: 42, is_unlimited: false });
      return json(path.endsWith('/all') ? { chat: quota('chat'), liuyao_chat: quota('liuyao_chat') } : quota('chat'));
    }
    if (path === '/conversations') {
      const q = request.nextUrl.searchParams;
      const matching = q.get('type') === 'liuyao' ? [] : previewConversations.filter(item => item.title.includes(q.get('q') || ''));
      const offset = Math.max(0, Number(q.get('offset')) || 0);
      const limit = Math.max(1, Number(q.get('limit')) || 20);
      return json({ items: matching.slice(offset, offset + limit), total: matching.length, has_more: offset + limit < matching.length });
    }
    if (path === '/conversations/9000') return json({ id: 9000, type: 'bazi', title: '个人报告（固定演示）', profile: previewProfile,
      messages: [{ id: 1, role: 'user', content: '我的命盘信息如下：固定演示', created_at: '2026-09-17T02:30:00Z' },
        { id: 2, role: 'assistant', content: previewReport, created_at: '2026-09-17T02:30:00Z' }] });
    if (path === '/conversations/9000/report') return json({ conversation_id: 9000, source_message_id: 2, type: 'bazi', kind: 'personal',
      title: '个人报告（固定演示）', question: null, facts: {}, generated_at: '2026-09-17T02:30:00Z', content: previewReport,
      sections: previewReport.split(/^### /m).filter(Boolean).map(section => { const [title, ...body] = section.split('\n'); return { title: title.trim(), body: body.join('\n').trim() }; }),
      profile: previewProfile, profile_changed: false, task_context: null, demo: true });
    const match = path.match(/^\/conversations\/(\d+)(\/digest)?$/);
    if (match) {
      const item = previewConversations.find(row => row.id === Number(match[1]));
      if (!item) return json({ detail: '没有这条演示记录' }, 404);
      if (match[2]) return json({ title: item.title, custom_title: null, question: item.last_user_message, summary: item.last_assistant_preview, topic: '事业', status: 'ready', generated_at: item.updated_at, source_message_id: 2, stale: false });
      return json({ ...item, type: 'bazi', profile: previewProfile, profile_changed: false, messages: [
        { id: 1, role: 'user', content: item.last_user_message, created_at: item.created_at },
        { id: 2, role: 'assistant', content: `### 思路整理\n\n${item.last_assistant_preview}\n\n${previewReply}`, created_at: item.updated_at },
      ] });
    }
    if (path === '/admin/stats/overview') return json(previewOverview);
    if (path.endsWith('/trend') && path.startsWith('/admin/stats/')) {
      const length = request.nextUrl.searchParams.get('period') === '7d' ? 7 : 30;
      return json({ data: Array.from({ length }, (_, i) => ({ date: new Date(Date.UTC(2026, 8, 17 - length + 1 + i)).toISOString().slice(0, 10), count: [2, 4, 1, 0, 3, 5, 3][i % 7] })) });
    }
    if (path === '/admin/stats/users/source') return json({ data: [{ source: 'web', label: '网站演示', count: 90 }, { source: 'email', label: '邮箱演示', count: 30 }] });
  }
  if (method === 'POST') {
    if (path === '/events/track') return json({ ok: true, demo: true });
    if (path === '/bazi/calc_paipan') return json({ mingpan: previewChart, demo: true, time_correction_note: '固定演示命盘，未根据输入重新计算' });
    if (path === '/chat/init') return json({ conversation_id: 'local-preview-chat' });
    if (['/chat', '/chat/start', '/chat/simplify', '/chat/regenerate'].includes(path)) {
      if (!request.headers.get('accept')?.includes('text/event-stream')) return json({ conversation_id: 'local-preview-chat', reply: previewReply });
      const encoder = new TextEncoder();
      const chunks = previewReply.match(/[\s\S]{1,18}/g) ?? [];
      let position = -1;
      const stream = new ReadableStream({
        async pull(controller) {
          if (request.signal.aborted) { controller.close(); return; }
          if (position === -1) {
            controller.enqueue(encoder.encode('event: meta\ndata: {"conversation_id":"local-preview-chat","demo":true}\n\n'));
            position = 0;
          } else if (position < chunks.length) {
            await new Promise(resolve => setTimeout(resolve, 45));
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: chunks[position++] })}\n\n`));
          } else {
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          }
        },
      });
      return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', 'X-Local-Preview': '1' } });
    }
  }
  return json({ detail: '本地演示暂不支持此操作；未连接真实服务，也未保存任何修改。' }, 501);
}

export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE };
