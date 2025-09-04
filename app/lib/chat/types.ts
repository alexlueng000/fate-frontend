export type Msg = { role: 'user' | 'assistant'; content: string };
export type FourPillars = { year: string[]; month: string[]; day: string[]; hour: string[] };
export type DayunItem = { age: number; start_year: number; pillar: string[] };
export type Paipan = { four_pillars: FourPillars; dayun: DayunItem[] };
export type Wuxing = '木' | '火' | '土' | '金' | '水';

export const QUICK_BUTTONS: Array<{ label: string; prompt: string }> = [
  { label: '性格特征', prompt: '请基于当前命盘，输出“性格特征分析”。结构：1)核心气质（3-5条），2)优势与闪光点（结合五行强弱），3)可能盲区与建议（避免绝对化）。最后一行提醒：理性看待，重在行动与选择。' },
  { label: '人物画像', prompt: '请输出“人物画像”。结构：1)关键词（5-8个），2)日常行为风格（3-5条），3)沟通偏好（2-3条），4)压力来源与调节建议（2-3条）。要求简洁、实用、非宿命化。' },
  { label: '正缘人物画像', prompt: '请输出“正缘人物画像”。结构：1)大致性格特征（4-6条），2)可能的职业/兴趣标签（3-5个），3)相处注意点（3条），4)提升吸引力建议（3条）。保持理性与尊重。' },
  { label: '事业建议', prompt: '请输出“事业建议”。结构：1)适配方向（3-5类并说明原因），2)当前阶段发力点（2-3条），3)避坑提醒（2-3条），4)未来一年可执行清单（4-6条，动词开头）。' },
  { label: '财运分析', prompt: '请输出“财运分析”。结构：1)财务优势与风险点（各2-3条），2)适合的增收路径（3-5条），3)管理建议（预算/储蓄/投资的简要框架）。不得承诺收益或具体时间点。' },
  { label: '健康分析', prompt: '请输出“健康分析”（生活建议，非医疗意见）。结构：1)日常关注点（2-3条），2)作息建议（3-5条），3)运动与饮食提示（各2-3条）。避免医学诊断与疗效承诺。' },
  { label: '正缘应期', prompt: '请输出“正缘相关的有利时段”——给出相对性阶段提醒。结构：1)倾向更顺的阶段（1-3段，描述特征而非具体日期），2)建议的准备与行动（3-5条）。避免具体时间与保证性表述。' },
];

/** 轻量 Markdown 归一化 */
// 处理由模型产生的“连在一行的 ###/#### 标题、尾部多余 #、缺空行、列表粘连”等问题
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

    // 移除粗体/斜体（常见 **/__/*）
    s = s.replace(/\*\*([^*\n]+)\*\*/g, "$1")
         .replace(/\*([^*\n]+)\*/g, "$1")
         .replace(/__([^_\n]+)__/g, "$1")
         .replace(/(\*\*|__)/g, "");

    // —— 标题规范化 —— //
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
    // 去掉行首多余缩进
    s = s.replace(/^[ \t]+(- |\d+\.\s)/gm, "$1");

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
