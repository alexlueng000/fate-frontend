// 六十四卦映射系统
export type Yao = 0 | 1; // 1 = 阳爻 ——  // 0 = 阴爻 -- --

export type TrigramKey =
  | "qian"
  | "dui"
  | "li"
  | "zhen"
  | "xun"
  | "kan"
  | "gen"
  | "kun";

export interface Trigram {
  key: TrigramKey;
  name: string;
  symbol: string;
  nature: string;
  lines: [Yao, Yao, Yao]; // 从下往上
}

export interface HexagramInfo {
  upper: TrigramKey;
  lower: TrigramKey;
  name: string;
  number: number;
}

export const TRIGRAMS: Record<TrigramKey, Trigram> = {
  qian: { key: "qian", name: "乾", symbol: "☰", nature: "天", lines: [1, 1, 1] },
  dui: { key: "dui", name: "兑", symbol: "☱", nature: "泽", lines: [1, 1, 0] },
  li: { key: "li", name: "离", symbol: "☲", nature: "火", lines: [1, 0, 1] },
  zhen: { key: "zhen", name: "震", symbol: "☳", nature: "雷", lines: [1, 0, 0] },
  xun: { key: "xun", name: "巽", symbol: "☴", nature: "风", lines: [0, 1, 1] },
  kan: { key: "kan", name: "坎", symbol: "☵", nature: "水", lines: [0, 1, 0] },
  gen: { key: "gen", name: "艮", symbol: "☶", nature: "山", lines: [0, 0, 1] },
  kun: { key: "kun", name: "坤", symbol: "☷", nature: "地", lines: [0, 0, 0] },
};

export const HEXAGRAMS: HexagramInfo[] = [
  { number: 1, upper: "qian", lower: "qian", name: "乾为天" },
  { number: 2, upper: "kun", lower: "kun", name: "坤为地" },
  { number: 3, upper: "kan", lower: "zhen", name: "水雷屯" },
  { number: 4, upper: "gen", lower: "kan", name: "山水蒙" },
  { number: 5, upper: "kan", lower: "qian", name: "水天需" },
  { number: 6, upper: "qian", lower: "kan", name: "天水讼" },
  { number: 7, upper: "kun", lower: "kan", name: "地水师" },
  { number: 8, upper: "kan", lower: "kun", name: "水地比" },
  { number: 9, upper: "xun", lower: "qian", name: "风天小畜" },
  { number: 10, upper: "qian", lower: "dui", name: "天泽履" },
  { number: 11, upper: "kun", lower: "qian", name: "地天泰" },
  { number: 12, upper: "qian", lower: "kun", name: "天地否" },
  { number: 13, upper: "qian", lower: "li", name: "天火同人" },
  { number: 14, upper: "li", lower: "qian", name: "火天大有" },
  { number: 15, upper: "kun", lower: "gen", name: "地山谦" },
  { number: 16, upper: "zhen", lower: "kun", name: "雷地豫" },
  { number: 17, upper: "dui", lower: "zhen", name: "泽雷随" },
  { number: 18, upper: "gen", lower: "xun", name: "山风蛊" },
  { number: 19, upper: "kun", lower: "dui", name: "地泽临" },
  { number: 20, upper: "xun", lower: "kun", name: "风地观" },
  { number: 21, upper: "li", lower: "zhen", name: "火雷噬嗑" },
  { number: 22, upper: "gen", lower: "li", name: "山火贲" },
  { number: 23, upper: "gen", lower: "kun", name: "山地剥" },
  { number: 24, upper: "kun", lower: "zhen", name: "地雷复" },
  { number: 25, upper: "qian", lower: "zhen", name: "天雷无妄" },
  { number: 26, upper: "gen", lower: "qian", name: "山天大畜" },
  { number: 27, upper: "gen", lower: "zhen", name: "山雷颐" },
  { number: 28, upper: "dui", lower: "xun", name: "泽风大过" },
  { number: 29, upper: "kan", lower: "kan", name: "坎为水" },
  { number: 30, upper: "li", lower: "li", name: "离为火" },
  { number: 31, upper: "dui", lower: "gen", name: "泽山咸" },
  { number: 32, upper: "zhen", lower: "xun", name: "雷风恒" },
  { number: 33, upper: "qian", lower: "gen", name: "天山遁" },
  { number: 34, upper: "zhen", lower: "qian", name: "雷天大壮" },
  { number: 35, upper: "li", lower: "kun", name: "火地晋" },
  { number: 36, upper: "kun", lower: "li", name: "地火明夷" },
  { number: 37, upper: "xun", lower: "li", name: "风火家人" },
  { number: 38, upper: "li", lower: "dui", name: "火泽睽" },
  { number: 39, upper: "kan", lower: "gen", name: "水山蹇" },
  { number: 40, upper: "zhen", lower: "kan", name: "雷水解" },
  { number: 41, upper: "gen", lower: "dui", name: "山泽损" },
  { number: 42, upper: "xun", lower: "zhen", name: "风雷益" },
  { number: 43, upper: "dui", lower: "qian", name: "泽天夬" },
  { number: 44, upper: "qian", lower: "xun", name: "天风姤" },
  { number: 45, upper: "dui", lower: "kun", name: "泽地萃" },
  { number: 46, upper: "kun", lower: "xun", name: "地风升" },
  { number: 47, upper: "dui", lower: "kan", name: "泽水困" },
  { number: 48, upper: "kan", lower: "xun", name: "水风井" },
  { number: 49, upper: "dui", lower: "li", name: "泽火革" },
  { number: 50, upper: "li", lower: "xun", name: "火风鼎" },
  { number: 51, upper: "zhen", lower: "zhen", name: "震为雷" },
  { number: 52, upper: "gen", lower: "gen", name: "艮为山" },
  { number: 53, upper: "xun", lower: "gen", name: "风山渐" },
  { number: 54, upper: "zhen", lower: "dui", name: "雷泽归妹" },
  { number: 55, upper: "zhen", lower: "li", name: "雷火丰" },
  { number: 56, upper: "li", lower: "gen", name: "火山旅" },
  { number: 57, upper: "xun", lower: "xun", name: "巽为风" },
  { number: 58, upper: "dui", lower: "dui", name: "兑为泽" },
  { number: 59, upper: "xun", lower: "kan", name: "风水涣" },
  { number: 60, upper: "kan", lower: "dui", name: "水泽节" },
  { number: 61, upper: "xun", lower: "dui", name: "风泽中孚" },
  { number: 62, upper: "zhen", lower: "gen", name: "雷山小过" },
  { number: 63, upper: "kan", lower: "li", name: "水火既济" },
  { number: 64, upper: "li", lower: "kan", name: "火水未济" },
];

function sameLines(a: Yao[], b: Yao[]) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export function getTrigramByLines(lines: [Yao, Yao, Yao]): Trigram {
  const trigram = Object.values(TRIGRAMS).find((t) => sameLines(t.lines, lines));

  if (!trigram) {
    throw new Error(`Invalid trigram lines: ${lines.join("")}`);
  }

  return trigram;
}

export function getHexagramByLines(lines: [Yao, Yao, Yao, Yao, Yao, Yao]) {
  const lowerLines = lines.slice(0, 3) as [Yao, Yao, Yao];
  const upperLines = lines.slice(3, 6) as [Yao, Yao, Yao];

  const lower = getTrigramByLines(lowerLines);
  const upper = getTrigramByLines(upperLines);

  const hexagram = HEXAGRAMS.find(
    (h) => h.upper === upper.key && h.lower === lower.key
  );

  if (!hexagram) {
    throw new Error(`Hexagram not found: upper=${upper.key}, lower=${lower.key}`);
  }

  return {
    ...hexagram,
    upperTrigram: upper,
    lowerTrigram: lower,
    lines,
  };
}

export function getHexagramByName(name: string): HexagramInfo | null {
  return HEXAGRAMS.find(h => h.name === name) || null;
}

export function getChangedLines(
  originalLines: [Yao, Yao, Yao, Yao, Yao, Yao],
  movingLines: number[]
): [Yao, Yao, Yao, Yao, Yao, Yao] {
  const result = [...originalLines] as [Yao, Yao, Yao, Yao, Yao, Yao];

  movingLines.forEach((lineNo) => {
    const index = lineNo - 1;

    if (index < 0 || index > 5) {
      throw new Error(`Invalid moving line: ${lineNo}`);
    }

    result[index] = result[index] === 1 ? 0 : 1;
  });

  return result;
}

export function calculateHexagramResult(
  originalLines: [Yao, Yao, Yao, Yao, Yao, Yao],
  movingLines: number[]
) {
  const original = getHexagramByLines(originalLines);
  const changedLines = getChangedLines(originalLines, movingLines);
  const changed = getHexagramByLines(changedLines);

  return {
    original,
    changed,
    movingLines,
  };
}
