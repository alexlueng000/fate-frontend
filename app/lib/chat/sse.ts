export async function trySSE(
  url: string,
  body: any,
  onDelta: (text: string) => void,   // 每次回调“整段最新文本”（已规范化）
  onMeta?: (meta: any) => void,
): Promise<void> {
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

  let rawBuf = "";  // SSE 原始缓冲（以 \n\n 切块）
  let text = "";    // 聚合后的“整段文本”

  // —— 统一/清理 —— //
  const normalize = (s: string): string => {
    // 0) 不可见空白
    s = s.replace(/[\u200b\u200c\u200d\uFEFF\u202f]/g, "");

    // 1) 去粗体/斜体残留
    s = s.replace(/\*\*([^*\n]+)\*\*/g, "$1")
         .replace(/\*([^*\n]+)\*/g, "$1")
         .replace(/__([^_\n]+)__/g, "$1")
         .replace(/(\*\*|__)/g, "");

    // 2) 标题（只保留 h3/h4）
    s = s.replace(/＃/g, "#");
    s = s.replace(/^[ \t]*#(?:[ \t]*#){1,5}[ \t]*/gm, "### ");      // "# ## 标题" -> "### "
    s = s.replace(/^[ \t]+(#{1,6})(?=\S|\s)/gm, "$1");              // 去前导空格
    s = s.replace(/^(#{5,6})[ \t]*/gm, "#### ");                    // 5/6 -> 4
    s = s.replace(/^(#{1,2})[ \t]*/gm, "### ");                     // 1/2 -> 3
    s = s.replace(/^(#{3,4})[ \t]+#{1,6}[ \t]*/gm, "$1 ");          // "###  ## 标题" -> "### "
    s = s.replace(/^(#{3,4})([^\s#])/gm, "$1 $2");                  // 标题后补空格
    s = s.replace(/^(#{3,4})\s*([^#\n]+?)\s*#+\s*$/gm, "$1 $2");    // 去标题尾部多余 #
    // 段内硬插标题：无空格或有空格的场景都断行
    s = s.replace(/([^\n])(#{3,4})(?=\S)/g, "$1\n\n$2 ");
    s = s.replace(/([^\n])\s+(#{3,4})\s+(?=\S)/g, "$1\n\n$2 ");
    // 标题前后空行
    s = s.replace(/([^\n])\n[ \t]*(#{3,4}\s)/g, "$1\n\n$2");
    s = s.replace(/(^|\n)[ \t]*(#{3,4}\s[^\n]+)\n(?!\n)/g, "$1$2\n\n");

    // 3) 列表 & 横线
    s = s.replace(/^[ \t]*[—–－][ \t]*/gm, "- ");                   // 行首全角横线 -> 列表
    s = s.replace(/([^ \n])\s+([\-—–－])\s+(?=\S)/g, "$1\n\n- ");    // 句中起列表 -> 换行
    s = s.replace(/^-\s+[—–－-]{2,}\s*/gm, "- ");                   // "- --- 文本" -> "- 文本"
    s = s.replace(/^[ \t]*-([^\s])/gm, "- $1");                     // "-一、" -> "- 一、"
    // 有序列表：只认行首 "1. / 1、 / 1．"
    s = s.replace(/^\s*(\d+)[\.．、]\s*/gm, (_m, n: string) => `${n}. `);
    // 删除整行分割线
    s = s.replace(/(^|\n)\s*[—–－-]{3,}\s*(\n|$)/g, "$1$2");

    // 4) CJK & 数字拆分修复
    // 4.1 汉字与汉字之间的任意空白（含换行）去掉
    s = s.replace(/([\p{Script=Han}])\s+([\p{Script=Han}])/gu, "$1$2");
    // 4.2 汉字与标点间的多余空白
    s = s.replace(/([\p{Script=Han}])\s+([，。、《》？！：；）】])/gu, "$1$2")
         .replace(/([（【《])\s+([\p{Script=Han}])/gu, "$1$2");
    // 4.3 数字被拆成“1↵2”时重新黏合（不在行首且后面不是列表标点）
    s = s.replace(/(?<!^)(\d)\s*\n+\s*(\d)(?![\.．、])/gm, "$1$2");
    // 4.4 行首出现“单独一行数字 + 下一行以数字开头文本”也黏合：1↵2项 -> 12项
    s = s.replace(/(^|\n)(\d)\s*\n\s*(\d)(?=[\p{Script=Han}A-Za-z])/g, (_m, p1, a, b) => `${p1}${a}${b}`);
    // 4.5 数字与汉字之间意外空格去掉
    s = s.replace(/(\d)\s+([\p{Script=Han}])/gu, "$1$2")
         .replace(/([\p{Script=Han}])\s+(\d)/gu, "$1$2");

    // 5) 免责声明（允许任意空格），前后强制空行
    const claim = /以\s*上\s*内\s*容\s*由\s*传\s*统\s*文\s*化\s*AI\s*生\s*成[^\n]*/g;
    s = s.replace(claim, (m) => `\n\n${m.replace(/\s+/g, " ")}\n\n`);

    // 6) 压缩空行 + 结尾两行
    s = s.replace(/\n{3,}/g, "\n\n");
    return s.trimEnd() + "\n\n";
  };

  // —— 单个 data 负载 -> 聚合 —— //
  const append = (payload: string) => {
    const trimmed = payload.trim();

    // ⚠️ 不要把“空白包”当换行（会拆中文/数字）
    if (trimmed === "" || payload === "  ") {
      return;
    }

    if (trimmed === "[DONE]") {
      // 结束信号；调用方自行收尾
    } else if (trimmed === "###" || trimmed === "####") {
      // 标题 token：保证标题独占一行（先补两个换行，再写 "#### "）
      if (!text.endsWith("\n\n")) {
        if (!text.endsWith("\n")) text += "\n";
        text += "\n";
      }
      text += trimmed + " ";
    } else if (/^[-—–－]$/.test(trimmed)) {
      // 列表 token：若不在行首则先换行
      if (!text.endsWith("\n")) text += "\n";
      text += "- ";
    } else if (/^[—–－-]{3,}\s*$/.test(trimmed)) {
      // 分割线整包 -> 丢弃
    } else {
      // 普通文本
      text += payload;
    }

    onDelta(normalize(text)); // 返回“当前整段”的规范化文本
  };

  // —— 读取 & 解析事件块 —— //
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    rawBuf += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = rawBuf.indexOf("\n\n")) !== -1) {
      const block = rawBuf.slice(0, idx);
      rawBuf = rawBuf.slice(idx + 2);

      for (const line of block.split("\n")) {
        if (!line.startsWith("data:")) continue;

        // 保留 data: 后原样内容（不要 trim 头部空格）
        const payload = line.slice(5);

        // meta（如果是 JSON）
        const t = payload.trim();
        if (t && t[0] === "{") {
          try {
            const obj = JSON.parse(t);
            if (obj && obj.meta && onMeta) {
              onMeta(obj.meta);
              continue;
            }
          } catch { /* 非 JSON，继续当普通增量 */ }
        }

        append(payload);
      }
    }
  }
}
