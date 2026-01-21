export type Msg = {
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean; // 新增（可选）
  meta?: {
    kind: string;
  };
};
export type FourPillars = { year: string[]; month: string[]; day: string[]; hour: string[] };
export type DayunItem = { age: number; start_year: number; pillar: string[] };
export type Paipan = { four_pillars: FourPillars; dayun: DayunItem[] };
export type Wuxing = '木' | '火' | '土' | '金' | '水';

export const QUICK_BUTTONS: Array<{ label: string; prompt: string }> = [
  { label: '性格特征', prompt: '请基于当前命盘，用子平和盲派深度分析人物性格优势' },
  { label: '人物画像', prompt: '请基于当前命盘，用子平和盲派深度分析人物画像身高体型气质动作等等' },
  { label: '正缘人物画像', prompt: '请基于当前命盘，用子平和盲派深度分析正缘人物画像' },
  { label: '事业建议', prompt: '请基于当前命盘，结合大运流年，用子平和盲派深度分析事业方向和可执行的建议（需引导用户加上当前背景）' },
  { label: '财运', prompt: '请基于当前命盘，结合大运流年，用子平和盲派深度分析财运吉凶' },
  { label: '健康', prompt: '请基于当前命盘，结合大运流年，用子平和盲派深度分析健康建议' },
  { label: '正缘应期', prompt: '请基于当前命盘，结合大运流年，用子平和盲派深度分析哪个流年应期概率最高（需要引导客户补充背景，当前单身/有对象，已婚/离异）' },
];

/** 轻量 Markdown 归一化 */
// 处理由模型产生的"连在一行的 ###/#### 标题、尾部多余 #、缺空行、列表粘连"等问题
export function normalizeMarkdown(md: string): string {
  if (!md) return "";
  md = md.replace(/\r\n?/g, "\n").replace(/\u00A0|\u3000/g, " ");

  // 统一全角井号为半角
  md = md.replace(/［/g, "[").replace(/］/g, "]").replace(/＃/g, "#");

  const parts = md.split(/(```[\s\S]*?```)/g);
  const cjkOrWord = "[\\u4e00-\\u9fa5A-Za-z0-9]";

  const fixed = parts.map((seg) => {
    if (/^```/.test(seg)) return seg;

    let s = seg;

    // ===== 保留所有 markdown 格式（粗体、斜体等）=====
    // 不再移除 **粗体**、__粗体__、*斜体*、_斜体_ 等格式

    // —— 标题规范化 —— //
    // 0) 通用处理：中文标题后紧跟内容的情况（无论有无空格）
    //    匹配格式：### 八字命盘总览年柱：... 或 ### 八字命盘总览 年柱：...
    s = s.replace(/^(#{3,4}\s+[\u4e00-\u9fff]{2,10})\s*(?=[\u4e00-\u9fff])/gm, "$1\n\n");

    // A) 去除标题行前导空格：  "   ### 标题" -> "### 标题"
    s = s.replace(/^[ \t]+(#{1,6})(?=\s|\S)/gm, "$1");

    // B) 把 5 级及以上压为 4 级；1–2 级提升为 3 级（行首，不管是否有空格）
    s = s.replace(/^(#{5,})[ \t]*/gm, "#### ");
    s = s.replace(/^(#{1,2})[ \t]*/gm, "### ");

    // C) 标题后缺空格：####标题 -> #### 标题
    s = s.replace(/^(#{3,4})([^\s#])/gm, "$1 $2");

    // D) 行尾多余 #：### 标题#### -> ### 标题
    s = s.replace(/^(#{3,4})\s*([^#\n]+?)\s*#+\s*$/gm, "$1 $2");

    // E) 段内硬插标题（中文紧贴/英文有空格都处理）：……####一、/…… #### Title
    s = s.replace(new RegExp(`([^\\n])\\s*(#{3,4})(?=${cjkOrWord})`, "g"), "$1\n\n$2 ");
    s = s.replace(/([^\n])\s+(#{3,4})\s+(?=\S)/g, "$1\n\n$2 ");

    // F) 标题上下强制空一行：允许标题前有空格也能命中
    s = s.replace(/([^\n])\n[ \t]*(#{3,4}\s)/g, "$1\n\n$2");
    s = s.replace(/(^|\n)[ \t]*(#{3,4}\s[^\n]+)(?!\n{2,})\n(?!\n)/g, "$1$2\n\n");
    s = s.replace(/(^|\n)[ \t]*(#{3,4}\s[^\n]+)\n(?!\n)/g, "$1$2\n\n");

    // —— 列表容错 —— //
    // 句中起列表：……文本 - 要点 / ……文本 1. 要点
    s = s.replace(/([^\n])\s+(- |\d+\.\s)/g, "$1\n\n$2");
    // 标题后紧贴列表
    s = s.replace(/(#{3,4}\s[^\n]+)\n(- |\d+\.\s)/g, "$1\n\n$2");
    // 段落中数字开头（如 "1.  **xxx**"）转为列表项
    s = s.replace(/([^\n])\s+(\d+\.\s+\*\*[^*]+\*\*)/g, "$1\n\n$2");
    s = s.replace(/^[^\n#].*?(\d+\.\s+\*\*[^*]+\*\*)/gm, "\n\n$1");
    // 处理行内粗体列表项：**1. xxx** -> 1. **xxx**
    s = s.replace(/^\*\*(\d+\.\s+[^*]+)\*\*/gm, "$1");
    // 去掉行首多余缩进
    s = s.replace(/^[ \t]+(- |\d+\.\s)/gm, "$1");

    // 移除水平分隔符（---、***、___）
    s = s.replace(/^\s*[-_*]{3,}\s*$/gm, "");

    // 压缩空行
    s = s.replace(/\n{3,}/g, "\n\n");

    return s.trim();
  });

  return fixed.join("").trim() + "\n";
}


/** 从 URL 读取排盘参数（用于首次进入时计算命盘） */
export function readPaipanParamsFromURL(): Record<string, string> | null {
  if (typeof window === 'undefined') return null;
  const sp = new URLSearchParams(window.location.search);
  const gender = sp.get('gender') || '';
  const calendar = sp.get('calendar') || 'gregorian';
  const birth_date = sp.get('birth_date') || '';
  const birth_time = sp.get('birth_time') || '12:00';
  const birthplace = sp.get('birthplace') || '';
  // const use_true_solar = sp.get('use_true_solar') || true;
  if (!birth_date) return null;
  return { gender, calendar, birth_date, birth_time, birthplace };
}
