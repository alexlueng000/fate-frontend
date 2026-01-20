// trySSE.ts
export async function trySSE(
  url: string,
  body: unknown,
  onDelta: (text: string) => void,   // 回调“当前整段最新文本”（已规范化）
  onMeta?: (meta: unknown) => void,
  opts?: { signal?: AbortSignal }    // ✅ 支持中止旧流
): Promise<void> {
  const log = (...a: unknown[]) => console.log('[SSE]', ...a);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify(body),
    signal: opts?.signal,            // ✅ 透传 signal
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

  // —— FINAL & STABLE —— //
  const normalize = (s: string): string => {
    s = s.replace(/\r\n?/g, '\n');

    // 统一空白/去零宽/行尾空格
    s = s.replace(/\p{Zs}/gu, ' ').replace(/[\u200B-\u200D\uFEFF]/g, '')
         .replace(/[ \t]+\n/g, '\n');

    // ===== 0) 先把全角#替为半角#，并确保"# + 空格"=====
    s = s.replace(/＃/g, '#')
         .replace(/^[ \t]*(#{1,6})([ \t]*)/gm, (_m, h: string) => `${h} `); // 不改级别，只补空格

    // ===== 1) 标题粘连修复 & 空行 =====
    // 修复标题后紧跟内容的情况（如 "### 八字命盘总览 年柱：乙巳"）
    // 在短标题（2-15个中文字符）后面如果紧跟内容，添加换行
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
          typeof (obj as any)?.conversation_id === 'string' ||
          typeof (obj as any)?.conversationId === 'string' ||
          typeof (obj as any)?.meta === 'object';

        const seg: string =
          (typeof (obj as any)?.delta   === 'string' && (obj as any).delta)   ||
          (typeof (obj as any)?.text    === 'string' && (obj as any).text)    ||
          (typeof (obj as any)?.content === 'string' && (obj as any).content) ||
          (typeof (obj as any)?.message === 'string' && (obj as any).message) || '';

        if (looksLikeMeta) {
          onMeta?.((obj as any).meta ?? obj);
          log('meta(obj)=', (obj as any).meta ?? obj);
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
