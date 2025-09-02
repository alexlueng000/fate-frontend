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
export function normalizeMarkdown(input: string): string {
  let s = input;
  s = s.replace(/^(\#{1,6})([^\s#])/gm, (_m, p1, p2) => `${p1} ${p2}`);
  s = s.replace(/^(\#{2,6})\s*([一二三四五六七八九十]+、)/gm, (_m, p1, p2) => `${p1} ${p2}`);
  s = s.replace(/([^\n])\n(#{1,6}\s)/g, (_m, p1, p2) => `${p1}\n\n${p2}`);
  s = s.replace(/：\s*(?=(?:-|\d+\.)\s)/g, '：\n');
  s = s.replace(/^(\s*[-•])([^\s-])/gm, (_m, p1, p2) => `${p1} ${p2}`);
  s = s.replace(/\n{3,}/g, '\n\n');
  s = s.trim();
  return s;
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
  const use_true_solar = sp.get('use_true_solar') || 'true';
  const lat = sp.get('lat') || '0';
  const lng = sp.get('lng') || '0';
  const longitude = sp.get('longitude') || '0';
  if (!birth_date) return null;
  return { gender, calendar, birth_date, birth_time, birthplace, use_true_solar, lat, lng, longitude };
}
