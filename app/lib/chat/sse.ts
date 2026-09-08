// trySSE.ts

/** 配额耗尽错误。前端可按 instanceof 分支显示充值引导。 */
export class QuotaExhaustedError extends Error {
  status = 429;
  detail: string;
  constructor(detail: string) {
    super(detail || '配额已用完');
    this.name = 'QuotaExhaustedError';
    this.detail = detail;
  }
}

export const CHAT_FAILURE_MESSAGE = '抱歉，本次解读生成失败。你可以刷新页面后重新提问，或稍后再试。';

type StreamOptions = { signal?: AbortSignal; mobilePacing?: boolean };

export async function trySSE(
  url: string,
  body: unknown,
  onDelta: (text: string) => void,
  onMeta?: (meta: unknown) => void,
  opts?: StreamOptions,
): Promise<void> {
  const controller = new AbortController();
  const abort = () => controller.abort(opts?.signal?.reason);
  opts?.signal?.addEventListener('abort', abort, { once: true });
  if (opts?.signal?.aborted) abort();
  const paced = opts?.mobilePacing && typeof window !== 'undefined'
    && window.matchMedia('(max-width: 767px)').matches
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let target = '';
  let visible = '';
  let idleTimer: ReturnType<typeof setTimeout>;
  const resetIdle = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => controller.abort(new Error(CHAT_FAILURE_MESSAGE)), 90_000);
  };
  const totalTimer = setTimeout(() => controller.abort(new Error(CHAT_FAILURE_MESSAGE)), 300_000);
  const emit = () => {
    if (visible === target) return;
    // Preserve Unicode code points and reveal about 28 characters per second.
    const length = Array.from(visible).length;
    visible = Array.from(target).slice(0, length + 3).join('');
    onDelta(visible);
  };
  const paceTimer = paced ? setInterval(emit, 108) : undefined;
  resetIdle();
  try {
    await readSSE(url, body, (text) => {
      if (text !== target) resetIdle();
      target = text;
      if (!paced || text.includes(CHAT_FAILURE_MESSAGE)) {
        visible = text;
        onDelta(text);
      } else if (!text.startsWith(visible)) {
        // Final Markdown normalization can rewrite already displayed text.
        visible = Array.from(text).slice(0, Array.from(visible).length).join('');
        onDelta(visible);
      }
    }, onMeta, { signal: controller.signal });
    clearTimeout(idleTimer!);
    clearTimeout(totalTimer);
    if (!target.trim()) throw new Error(CHAT_FAILURE_MESSAGE);
    // Keep the message streaming until the display queue is drained.
    while (visible !== target) {
      controller.signal.throwIfAborted();
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  } finally {
    clearTimeout(idleTimer!);
    clearTimeout(totalTimer);
    clearInterval(paceTimer);
    opts?.signal?.removeEventListener('abort', abort);
    controller.abort();
  }
}

async function readSSE(
  url: string,
  body: unknown,
  onDelta: (text: string) => void,   // 回调"当前整段最新文本"（已规范化）
  onMeta?: (meta: unknown) => void,
  opts?: { signal?: AbortSignal }    // ✅ 支持中止旧流
): Promise<void> {
  const log = (...a: unknown[]) => console.log('[SSE]', ...a);

  // 构建请求头，自动添加 Authorization
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
  };
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: opts?.signal,            // ✅ 透传 signal
  });

  // 配额耗尽：抛出可识别的错误，避免被一次性兜底覆盖
  if (res.status === 429) {
    let detail = '配额已用完';
    try {
      const txt = await res.text();
      try {
        const obj = JSON.parse(txt);
        detail = (obj && (obj.detail || obj.message)) || txt || detail;
      } catch {
        detail = txt || detail;
      }
    } catch { /* ignore */ }
    throw new QuotaExhaustedError(typeof detail === 'string' ? detail : '配额已用完');
  }

  const ct = res.headers.get('content-type') || '';
  if (!res.ok || !ct.includes('text/event-stream') || !res.body) {
    throw new Error(`SSE not available (status ${res.status}, ct=${ct})`);
  }

  const reader  = res.body.getReader();
  const decoder = new TextDecoder('utf-8');

  let rawBuf = '';       // 以 \n\n 切块
  let text   = '';       // 聚合后的全文
  let lastEmitted = '';
  let rafId: number | null = null;

  // —— FINAL & STABLE —— //
  const normalize = (s: string): string => {
    s = s.replace(/\r\n?/g, '\n');

    // 统一空白/去零宽/行尾空格
    s = s.replace(/\p{Zs}/gu, ' ').replace(/[\u200B-\u200D\uFEFF]/g, '')
         .replace(/[ \t]+\n/g, '\n');

    // ===== 0) 先把全角#替为半角#，规范标题级别（1-2级提升为3级，5级+压为4级）=====
    s = s.replace(/＃/g, '#')
         .replace(/^[ \t]*(#{5,})\s/gm, '#### ')   // 5级+压为4级
         .replace(/^[ \t]*(#{1,2})\s/gm, '### ')   // 1-2级提升为3级
         .replace(/^[ \t]*(#{3,4})\s/gm, (_m, h: string) => `${h} `); // 3-4级补空格

    // ===== 1) 标题粘连修复 & 空行 =====
    // 只处理特定的已知标题后紧跟内容的情况（无论有无空格）
    const knownTitles = [
      '八字命盘总览', '性格亮点与潜能', '能量平衡与适合方向',
      '能量调候与注意事项', '能量辅助建议', '总体运势',
      '事业发展', '财运分析', '感情婚姻', '健康提示'
    ];
    for (const title of knownTitles) {
      const re = new RegExp(`^(#{1,6}\\s+${title})\\s*(?=[\\u4e00-\\u9fff])`, 'gm');
      s = s.replace(re, '$1\n\n');
    }
    // 通用处理：标题后有空格再跟中文内容的情况
    s = s.replace(/^(#{1,6}\s+[\u4e00-\u9fff\w]{2,15})\s+(?=[\u4e00-\u9fff])/gm, '$1\n\n');

    // 标题前后留空行（防止"不起头"）
    s = s.replace(/([^\n])\n(#{1,6}\s[^\n]+)/g, '$1\n\n$2')
         .replace(/(#{1,6}\s[^\n]+)(?!\n\n)/gm, '$1\n\n');

    // 移除水平分隔符（---、***、___）
    s = s.replace(/^\s*[-_*]{3,}\s*$/gm, '');

    // ===== 2) 列表规范 =====
    // 2.1 项目符号 → 连成 "- "，并保证行首
    s = s.replace(/([^\n])\s*[•●◦▪▫]\s+/g, '$1\n- ')
         .replace(/^[ \t]*[•●◦▪▫][ \t]*/gm, '- ')
         // 仅"行首的"横线才当列表标记；行内的横线保留（保护 25-27）
         .replace(/^[ \t]*[—–－-][ \t]+/gm, '- ');

    // 2.2 有序列表：标准化成 "n. "，并确保行首
    s = s.replace(/^[ \t]*(\d+)[\.．、][ \t]*/gm, (_m, n: string) => `${n}. `)
         // 若段落中出现了 " 1. " 开头但不在行首，补换行（不影响小数 1.23，因为它不在行首）
         .replace(/([^\n])\s+(?=\d+\. [^\n])/g, '$1\n');

    // ===== 3) 中文"行内空格"清理 =====
    const CJK = '\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF';
    const SP  = ' \\t\\u00A0\\u1680\\u2000-\\u200A\\u202F\\u205F\\u3000';
    s = s
      .replace(new RegExp(`([${CJK}])[${SP}]+([${CJK}])`, 'g'), '$1$2')
      .replace(new RegExp(`([${CJK}])[${SP}]+([，。、《》？！：；）】])`, 'g'), '$1$2')
      .replace(new RegExp(`([（【《])[${SP}]+([${CJK}])`, 'g'), '$1$2')
      .replace(new RegExp(`(\\d)[${SP}]+([${CJK}])`, 'g'), '$1$2')
      .replace(new RegExp(`([${CJK}])[${SP}]+(\\d)`, 'g'), '$1$2')
      .replace(/[ \t]*：[ \t]*/g, '：')
      .replace(/(\d)[ \t]*[．.][ \t]*(\d)/g, '$1.$2'); // 小数点/编号点归一

    // 段落空行收敛
    s = s.replace(/\n{3,}/g, '\n\n');

    return s.trimEnd() + '\n\n';
  };

  const scheduleEmit = () => {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      const normalized = normalize(text);
      if (normalized !== lastEmitted) {
        lastEmitted = normalized;
        onDelta(normalized);
        log('emit len=', normalized.length, 'tail=', normalized.slice(-30).replace(/\n/g, '\\n'));
      }
    });
  };

  // 判断当前是否在“行首”（用于把孤立符号识别成标题/列表）
  const atLineStart = () => /\n\s*$/.test(text) || text === '';

  const appendRawToken = (payload: string) => {
    const trimmed = payload.trim();
    if (trimmed === '' || payload === '  ') return;
    if (trimmed === '[DONE]') return;

    // 行首 + 孤立 # → 标题起始
    if ((trimmed === '#' || trimmed === '##' || trimmed === '###' || trimmed === '＃') && atLineStart()) {
      if (!text.endsWith('\n\n')) { if (!text.endsWith('\n')) text += '\n'; text += '\n'; }
      text += (trimmed === '＃' ? '# ' : trimmed + ' ');
      scheduleEmit();
      return;
    }

    // 行首 + 孤立列表标记 → 新起一行的 "- "
    if (/^[-—–－•●◦▪▫]$/.test(trimmed) && atLineStart()) {
      if (!text.endsWith('\n')) text += '\n';
      text += '- ';
      scheduleEmit();
      return;
    }

    // 其它情况：原样追加（保护 25-27 这种区间，不误判列表）
    text += payload;
    scheduleEmit();
  };

  // “整段替换 vs 片段追加”的智能选择
  const appendSegmentSmart = (seg: string) => {
    if (!seg) return;
    const looksFull =
      seg.length >= text.length &&
      (text === '' || seg.startsWith(text.slice(0, Math.min(text.length, 16))));
    if (looksFull) {
      text = seg;                      // 替换整段
      log('replace(full) len=', seg.length);
    } else {
      text += seg;                     // 追加片段
      log('append(seg) len=', seg.length);
    }
    scheduleEmit();
  };

  // 逐条处理 data 行
  const handleDataLine = (line: string, eventName: string | null) => {
    const payload = line;             // 不去掉头部空格
    const t = payload.trim();
    if (t === '' || t === '[DONE]') return;

    // 显式 meta 事件
    if (eventName === 'meta') {
      try {
        const obj = JSON.parse(t);
        onMeta?.(obj?.meta ?? obj);
        log('meta(event)=', obj?.meta ?? obj);
      } catch {
        onMeta?.(t);
        log('meta(event,text)=', t);
      }
      return;
    }

    // 尝试 JSON
    if (t[0] === '{' || t[0] === '[') {
      try {
        const obj: Record<string, unknown> = JSON.parse(t);

        const looksLikeMeta =
          typeof obj?.conversation_id === 'string' ||
          typeof obj?.conversationId === 'string' ||
          typeof obj?.meta === 'object';

        const seg: string =
          (typeof obj?.delta   === 'string' && obj.delta)   ||
          (typeof obj?.text    === 'string' && obj.text)    ||
          (typeof obj?.content === 'string' && obj.content) ||
          (typeof obj?.message === 'string' && obj.message) || '';

        if (looksLikeMeta) {
          onMeta?.(obj.meta ?? obj);
          log('meta(obj)=', obj.meta ?? obj);
          if (!seg) return; // 纯 meta 不落正文
        }

        if (seg) {
          if ((obj as { replace?: boolean })?.replace === true) {
            text = seg;
            log('replace(flag) len=', seg.length);
            scheduleEmit();
          } else {
            appendSegmentSmart(seg);
          }
          return;
        }

        // 有结构化文本字段（即使为空），不当作纯文本处理
        if (obj?.replace === true ||
            typeof obj?.delta   === 'string' ||
            typeof obj?.text    === 'string' ||
            typeof obj?.content === 'string' ||
            typeof obj?.message === 'string') {
          return;
        }

        // 非 meta 且无 seg，则当作纯文本
        appendRawToken(payload);
        return;
      } catch {
        appendRawToken(payload);
        return;
      }
    }

    // 纯文本
    appendRawToken(payload);
  };

  // 处理一个 \n\n 分隔的事件块：逐条 data 行处理
  const processBlock = (block: string) => {
    let eventName: string | null = null;
    const dataLines: string[] = [];
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) eventName = line.slice(6).trim();
      else if (line.startsWith('data:')) dataLines.push(line.slice(5));
    }
    if (dataLines.length === 0) return;
    for (const d of dataLines) handleDataLine(d, eventName);
  };

  // —— 读取 & 解析 —— //
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      rawBuf += chunk;
      rawBuf = rawBuf.replace(/\r\n/g, '\n');
      log('chunk bytes=', chunk.length);

      let idx: number;
      while ((idx = rawBuf.indexOf('\n\n')) !== -1) {
        const block = rawBuf.slice(0, idx);
        rawBuf = rawBuf.slice(idx + 2);
        processBlock(block);
      }
    }

    // 末尾残块
    if (rawBuf.trim()) {
      processBlock(rawBuf);
    }

    // 最后一发
    const normalized = normalize(text);
    if (normalized !== lastEmitted) {
      lastEmitted = normalized;
      onDelta(normalized);
      log('emit(final) len=', normalized.length);
    }
  } finally {
    if (rafId !== null) cancelAnimationFrame(rafId);
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
