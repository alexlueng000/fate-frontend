import type { BirthSeason } from './calendar';

export type WuxingDominance = '木' | '火' | '土' | '金' | '水' | '平衡';

const MINGLI_PERSONA: Record<WuxingDominance, string> = {
  '木': '你像一棵树。想向上长，也会被风压弯。',
  '火': '你像一团火。想发光，也会烧累。',
  '土': '你像一片大地。能承载，也会觉得重。',
  '金': '你像一道风。想自由，也会觉得冷。',
  '水': '你像一条河。想流动，也会觉得孤独。',
  '平衡': '你像四季。有时暖，有时冷。',
};

const PLAIN_PERSONA: Record<BirthSeason, string> = {
  spring: '你像春天。想发芽，也会敏感。',
  summer: '你像夏天。想发光，也会烧累。',
  autumn: '你像秋天。想沉淀，也会感伤。',
  winter: '你像冬天。想安静，也会孤独。',
};

export function getMingliPersonaSentence(d: WuxingDominance): string {
  return MINGLI_PERSONA[d];
}

export function getPlainPersonaSentence(s: BirthSeason): string {
  return PLAIN_PERSONA[s];
}

// 根据 wuxing_count + balance_score 判定主导五行：
// - balance_score >= 75 视为平衡
// - 否则 top 与 second 差距 <=1 也视为平衡
// - 其余取计数最高者
export function deriveWuxingDominance(
  wuxingCount: Record<string, number> | undefined,
  balanceScore: number | undefined,
): WuxingDominance {
  if (!wuxingCount) return '平衡';
  if ((balanceScore ?? 0) >= 75) return '平衡';

  const sorted = Object.entries(wuxingCount).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return '平衡';
  const [top, second] = sorted;
  if (top[1] - (second?.[1] ?? 0) <= 1) return '平衡';
  return top[0] as WuxingDominance;
}
