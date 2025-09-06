// trySSE.ts
export async function trySSE(
  url: string,
  body: unknown,
  onDelta: (text: string) => void,   // 回调“当前整段最新文本”（已规范化）
  onMeta?: (meta: unknown) => void,
): Promise<void> {
  const log = (...args: unknown[]) => console.log('[SSE]', ...args);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify(body),
  });

  const ct = res.headers.get("content-type") || "";
  if (!res.ok || !ct.includes("text/event-stream") || !res.body) {
    throw new Error(`SSE not available (status ${res.status}, ct=${ct})`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");

  let rawBuf = "";        // 以 \n\n 切块的原始缓冲
  let text = "";          // 聚合后的全文
  let lastEmitted = "";   // 避免重复回调
  let rafId: number | null = null;

  const normalize = (s: string): string => {
    // 去不可见空白
    s = s.replace(/[\u200b\u200c\u200d\uFEFF\u202f]/g, "");
    // 简化粗体/斜体残留
    s = s.replace(/\*\*([^*\n]+)\*\*/g, "$1")
         .replace(/\*([^*\n]+)\*/g, "$1")
         .replace(/__([^_\n]+)__/g, "$1")
         .replace(/(\*\*|__)/g, "");
    // 标题统一到 h3/h4，并保证空行
    s = s.replace(/＃/g, "#")
         .replace(/^[ \t]*#(?:[ \t]*#){1,5}[ \t]*/gm, "### ")
         .replace(/^[ \t]+(#{1,6})(?=\S|\s)/gm, "$1")
         .replace(/^(#{5,6})[ \t]*/gm, "#### ")
         .replace(/^(#{1,2})[ \t]*/gm, "### ")
         .replace(/^(#{3,4})[ \t]+#{1,6}[ \t]*/gm, "$1 ")
         .replace(/^(#{3,4})([^\s#])/gm, "$1 $2")
         .replace(/^(#{3,4})\s*([^#\n]+?)\s*#+\s*$/gm, "$1 $2")
         .replace(/([^\n])(#{3,4})(?=\S)/g, "$1\n\n$2 ")
         .replace(/([^\n])\s+(#{3,4})\s+(?=\S)/g, "$1\n\n$2 ")
         .replace(/([^\n])\n[ \t]*(#{3,4}\s)/g, "$1\n\n$2")
         .replace(/(^|\n)[ \t]*(#{3,4}\s[^\n]+)\n(?!\n)/g, "$1$2\n\n");
    // 列表 & 横线
    s = s.replace(/^[ \t]*[—–－][ \t]*/gm, "- ")
         .replace(/([^ \n])\s+([\-—–－])\s+(?=\S)/g, "$1\n\n- ")
         .replace(/^-\s+[—–－-]{2,}\s*/gm, "- ")
         .replace(/^[ \t]*-([^\s])/gm, "- $1")
         .replace(/^\s*(\d+)[\.．、]\s*/gm, (_m, n: string) => `${n}. `)
         .replace(/(^|\n)\s*[—–－-]{3,}\s*(\n|$)/g, "$1$2");
    // CJK/数字黏合
    s = s.replace(/([\p{Script=Han}])\s+([\p{Script=Han}])/gu, "$1$2")
         .replace(/([\p{Script=Han}])\s+([，。、《》？！：；）】])/gu, "$1$2")
         .replace(/([（【《])\s+([\p{Script=Han}])/gu, "$1$2")
         .replace(/(?<!^)(\d)\s*\n+\s*(\d)(?![\.．、])/gm, "$1$2")
         .replace(
          /(^|\n)(\d)\s*\n\s*(\d)(?=[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFFA-Za-z])/g,
          (_m, p1, a, b) => `${p1}${a}${b}`)
         .replace(/(\d)\s+([\p{Script=Han}])/gu, "$1$2")
         .replace(/([\p{Script=Han}])\s+(\d)/gu, "$1$2");
    // 压空行
    s = s.replace(/\n{3,}/g, "\n\n");
    return s.trimEnd() + "\n\n";
  };

  const emitIfChanged = () => {
    const normalized = normalize(text);
    if (normalized !== lastEmitted) {
      lastEmitted = normalized;
      onDelta(normalized);
      log('emit len=', normalized.length, 'tail=', normalized.slice(-30).replace(/\n/g, '\\n'));
    }
  };

  const appendRaw = (payload: string) => {
    const trimmed = payload.trim();
    if (trimmed === "" || payload === "  ") { log('skip blank'); return; }
    if (trimmed === "[DONE]") { log('DONE'); return; }

    if (trimmed === "###" || trimmed === "####") {
      if (!text.endsWith("\n\n")) { if (!text.endsWith("\n")) text += "\n"; text += "\n"; }
      text += trimmed + " ";
    } else if (/^[-—–－]$/.test(trimmed)) {
      if (!text.endsWith("\n")) text += "\n";
      text += "- ";
    } else if (/^[—–－-]{3,}\s*$/.test(trimmed)) {
      log('drop hr');
    } else {
      text += payload;
    }

    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(emitIfChanged);
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    rawBuf += chunk;
    log('chunk bytes=', chunk.length);

    let idx: number;
    while ((idx = rawBuf.indexOf("\n\n")) !== -1) {
      const block = rawBuf.slice(0, idx);
      rawBuf = rawBuf.slice(idx + 2);

      for (const line of block.split("\n")) {
        if (!line.startsWith("data:")) continue;

        const payload = line.slice(5); // 不 trim 头部空格
        const t = payload.trim();

        // 兼容 data: {"meta":..., "delta":"..."} 或 {"text":"..."}
        if (t && t[0] === "{") {
          try {
            const obj = JSON.parse(t);
            let used = false;

            if (obj?.meta && onMeta) { onMeta(obj.meta); log('meta=', obj.meta); used = true; }

            const seg =
              typeof obj?.delta === 'string' ? obj.delta :
              (typeof obj?.text === 'string' ? obj.text : '');

            if (seg) { log('json seg len=', seg.length, 'tail=', String(seg).slice(-20)); appendRaw(seg); used = true; }

            if (used) continue;
          } catch {
            log('json parse failed -> raw');
          }
        }

        log('raw len=', payload.length, 'tail=', payload.slice(-20));
        appendRaw(payload);
      }
    }
  }

  if (rawBuf.trim()) {
    log('flush tail');
    for (const line of rawBuf.split("\n")) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5);
      const t = payload.trim();
      if (t && t[0] === "{") {
        try {
          const obj = JSON.parse(t);
          if (obj?.meta && onMeta) { onMeta(obj.meta); log('meta=', obj.meta); }
          const seg =
            typeof obj?.delta === 'string' ? obj.delta :
            (typeof obj?.text === 'string' ? obj.text : '');
          if (seg) appendRaw(seg);
        } catch {
          appendRaw(payload);
        }
      } else {
        appendRaw(payload);
      }
    }
  }

  emitIfChanged();
}
