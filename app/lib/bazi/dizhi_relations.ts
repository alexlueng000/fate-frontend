// 地支六冲：互相对冲
const LIUCHONG: [string, string][] = [
  ['子', '午'], ['丑', '未'], ['寅', '申'],
  ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
];

// 地支六合
const LIUHE: [string, string][] = [
  ['子', '丑'], ['寅', '亥'], ['卯', '戌'],
  ['辰', '酉'], ['巳', '申'], ['午', '未'],
];

// 地支三合局
const SANHE: [string, string, string, string][] = [
  ['申', '子', '辰', '水'],
  ['亥', '卯', '未', '木'],
  ['寅', '午', '戌', '火'],
  ['巳', '酉', '丑', '金'],
];

// 地支三会局（方合）
const SANHUI: [string, string, string, string][] = [
  ['寅', '卯', '辰', '木'],
  ['巳', '午', '未', '火'],
  ['申', '酉', '戌', '金'],
  ['亥', '子', '丑', '水'],
];

// 地支相刑
// 三刑：寅巳申（无恩之刑），丑戌未（持势之刑），子卯（无礼之刑），辰辰/午午/酉酉/亥亥（自刑）
const XING_MAP: Record<string, string> = {
  寅: '巳', 巳: '申', 申: '寅',
  丑: '戌', 戌: '未', 未: '丑',
  子: '卯', 卯: '子',
  辰: '辰', 午: '午', 酉: '酉', 亥: '亥',
};

// 地支相害（六害）
const LIUHAI: [string, string][] = [
  ['子', '未'], ['丑', '午'], ['寅', '巳'],
  ['卯', '辰'], ['申', '亥'], ['酉', '戌'],
];

// 天干五合
const TIANGANHE: [string, string, string][] = [
  ['甲', '己', '土'], ['乙', '庚', '金'], ['丙', '辛', '水'],
  ['丁', '壬', '木'], ['戊', '癸', '火'],
];

// 天干相冲（七冲）
const TIANGANCHONG: [string, string][] = [
  ['甲', '庚'], ['乙', '辛'], ['丙', '壬'], ['丁', '癸'],
];

export interface DizhiRelations {
  chong: string[];   // 冲：e.g. ['年冲月', '日冲时']
  he: string[];      // 合：六合
  sanhe: string[];   // 三合
  sanhui: string[];  // 三会
  xing: string[];    // 刑
  hai: string[];     // 害
}

export interface TianganRelations {
  he: string[];    // 五合
  chong: string[]; // 相冲
}

const PILLAR_NAMES = ['年', '月', '日', '时'];

export function getDizhiRelations(zhis: string[]): DizhiRelations {
  const chong: string[] = [];
  const he: string[] = [];
  const sanhe: string[] = [];
  const sanhui: string[] = [];
  const xing: string[] = [];
  const hai: string[] = [];

  // 两两检测（六冲、六合、相害、相刑）
  for (let i = 0; i < zhis.length; i++) {
    for (let j = i + 1; j < zhis.length; j++) {
      const a = zhis[i];
      const b = zhis[j];
      const label = `${PILLAR_NAMES[i]}${PILLAR_NAMES[j]}`;

      // 六冲
      if (LIUCHONG.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) {
        chong.push(`${label}冲`);
      }

      // 六合
      if (LIUHE.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) {
        he.push(`${label}合`);
      }

      // 六害
      if (LIUHAI.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) {
        hai.push(`${label}害`);
      }
    }

    // 自刑（单柱自刑）
    if (['辰', '午', '酉', '亥'].includes(zhis[i])) {
      // 单柱不做自刑提示，只做多柱重复时
    }

    // 两柱相刑
    for (let j = i + 1; j < zhis.length; j++) {
      const a = zhis[i];
      const b = zhis[j];
      const label = `${PILLAR_NAMES[i]}${PILLAR_NAMES[j]}`;
      if (XING_MAP[a] === b || XING_MAP[b] === a) {
        // 避免六冲已标注的情况下重复，刑和冲可共存
        xing.push(`${label}刑`);
      }
    }
  }

  // 三合：检查四柱中是否含三合组合中的三个字
  for (const [a, b, c, wuxing] of SANHE) {
    const present = [a, b, c].filter(z => zhis.includes(z));
    if (present.length === 3) {
      sanhe.push(`${a}${b}${c}三合${wuxing}局`);
    } else if (present.length === 2) {
      // 半合也标注
      const names = present.map(z => PILLAR_NAMES[zhis.indexOf(z)]);
      sanhe.push(`${names.join('')}半合${wuxing}（缺${[a,b,c].find(z => !zhis.includes(z))}）`);
    }
  }

  // 三会：检查四柱中是否含三会组合
  for (const [a, b, c, wuxing] of SANHUI) {
    const present = [a, b, c].filter(z => zhis.includes(z));
    if (present.length === 3) {
      sanhui.push(`${a}${b}${c}三会${wuxing}局`);
    }
  }

  return { chong, he, sanhe, sanhui, xing, hai };
}

export function getTianganRelations(gans: string[]): TianganRelations {
  const he: string[] = [];
  const chong: string[] = [];

  for (let i = 0; i < gans.length; i++) {
    for (let j = i + 1; j < gans.length; j++) {
      const a = gans[i];
      const b = gans[j];
      const label = `${PILLAR_NAMES[i]}${PILLAR_NAMES[j]}`;

      if (TIANGANHE.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) {
        const result = TIANGANHE.find(([x, y]) => (x === a && y === b) || (x === b && y === a));
        he.push(`${label}合${result?.[2] || ''}`);
      }

      if (TIANGANCHONG.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) {
        chong.push(`${label}冲`);
      }
    }
  }

  return { he, chong };
}
