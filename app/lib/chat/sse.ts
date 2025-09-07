// trySSE.ts
export async function trySSE(
  url: string,
  body: unknown,
  onDelta: (text: string) => void,   // 回调“当前整段最新文本”（已规范化）
  onMeta?: (meta: unknown) => void,
): Promise<void> {
  const log = (...a: unknown[]) => console.log('[SSE]', ...a);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify(body),
  });

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

  // —— 你的 normalize（原样保留）——
  const normalize = (s: string): string => {
    s = s.replace(/[\u200b\u200c\u200d\uFEFF\u202f]/g, '');
    s = s.replace(/\*\*([^*\n]+)\*\*/g, '$1')
         .replace(/\*([^*\n]+)\*/g, '$1')
         .replace(/__([^_\n]+)__/g, '$1')
         .replace(/(\*\*|__)/g, '');
    s = s.replace(/＃/g, '#')
         .replace(/^[ \t]*#(?:[ \t]*#){1,5}[ \t]*/gm, '### ')
         .replace(/^[ \t]+(#{1,6})(?=\S|\s)/gm, '$1')
         .replace(/^(#{5,6})[ \t]*/gm, '#### ')
         .replace(/^(#{1,2})[ \t]*/gm, '### ')
         .replace(/^(#{3,4})[ \t]+#{1,6}[ \t]*/gm, '$1 ')
         .replace(/^(#{3,4})([^\s#])/gm, '$1 $2')
         .replace(/^(#{3,4})\s*([^#\n]+?)\s*#+\s*$/gm, '$1 $2')
         .replace(/([^\n])(#{3,4})(?=\S)/g, '$1\n\n$2 ')
         .replace(/([^\n])\s+(#{3,4})\s+(?=\S)/g, '$1\n\n$2 ')
         .replace(/([^\n])\n[ \t]*(#{3,4}\s)/g, '$1\n\n$2')
         .replace(/(^|\n)[ \t]*(#{3,4}\s[^\n]+)\n(?!\n)/g, '$1$2\n\n');
    s = s.replace(/^[ \t]*[—–－][ \t]*/gm, '- ')
         .replace(/([^ \n])\s+([\-—–－])\s+(?=\S)/g, '$1\n\n- ')
         .replace(/^-\s+[—–－-]{2,}\s*/gm, '- ')
         .replace(/^[ \t]*-([^\s])/gm, '- $1')
         .replace(/^\s*(\d+)[\.．、]\s*/gm, (_m, n: string) => `${n}. `)
         .replace(/(^|\n)\s*[—–－-]{3,}\s*(\n|$)/g, '$1$2');
    s = s.replace(/([\p{Script=Han}])\s+([\p{Script=Han}])/gu, '$1$2')
         .replace(/([\p{Script=Han}])\s+([，。、《》？！：；）】])/gu, '$1$2')
         .replace(/([（【《])\s+([\p{Script=Han}])/gu, '$1$2')
         .replace(/(?<!^)(\d)\s*\n+\s*(\d)(?![\.．、])/gm, '$1$2')
         .replace(
           /(^|\n)(\d)\s*\n\s*(\d)(?=[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFFA-Za-z])/g,
           (_m, p1, a, b) => `${p1}${a}${b}`
         )
         .replace(/(\d)\s+([\p{Script=Han}])/gu, '$1$2')
         .replace(/([\p{Script=Han}])\s+(\d)/gu, '$1$2');
    s = s.replace(/\n{3,}/g, '\n\n');
    return s.trimEnd() + '\n\n';
  };

  const scheduleEmit = () => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      const normalized = normalize(text);
      if (normalized !== lastEmitted) {
        lastEmitted = normalized;
        onDelta(normalized);
        log('emit len=', normalized.length, 'tail=', normalized.slice(-30).replace(/\n/g, '\\n'));
      }
    });
  };

  const appendRawToken = (payload: string) => {
    const trimmed = payload.trim();
    if (trimmed === '' || payload === '  ') return;
    if (trimmed === '[DONE]') return;

    if (trimmed === '###' || trimmed === '####') {
      if (!text.endsWith('\n\n')) { if (!text.endsWith('\n')) text += '\n'; text += '\n'; }
      text += trimmed + ' ';
    } else if (/^[-—–－]$/.test(trimmed)) {
      if (!text.endsWith('\n')) text += '\n';
      text += '- ';
    } else if (/^[—–－-]{3,}\s*$/.test(trimmed)) {
      // drop hr
    } else {
      text += payload;
    }
    scheduleEmit();
  };

  const appendSegmentSmart = (seg: string) => {
    if (!seg) return;
    const looksFull =
      seg.length >= text.length &&
      (text === '' || seg.startsWith(text.slice(0, Math.min(text.length, 16))));
    if (looksFull) {
      text = seg;
      log('replace(full) len=', seg.length);
    } else {
      text += seg;
      log('append(seg) len=', seg.length);
    }
    scheduleEmit();
  };

  // 逐条处理 data 行（修复 meta 被拼进正文的问题）
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

      // ① 如果是 meta，就先抛给 onMeta
      if (looksLikeMeta) {
        onMeta?.(obj.meta ?? obj);
        log('meta(obj)=', obj.meta ?? obj);
        // 只有 meta、没有文本段：直接丢弃，不并入正文
        if (!seg) return;
      }

      // ② 有文本段再写入
      if (seg) {
        if ((obj as any)?.replace === true) {
          text = seg;
          log('replace(flag) len=', seg.length);
          scheduleEmit();
        } else {
          appendSegmentSmart(seg);
        }
        return;
      }

      // ③ 既不是纯 meta，也没 seg，就当纯文本
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

  // 处理一个 \n\n 分隔的事件块：逐条 data 行处理（而不是 join）
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
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    rawBuf += chunk;
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
}
