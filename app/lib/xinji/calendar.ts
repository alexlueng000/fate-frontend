// 心镜灯 · 节气与天色工具
// 用公历近似日期判定节气分组（每年实际节气日期浮动 ±1 天，
// 在边界附近的日子可能差一天，但句子级别的展示可接受）。

export type SolarTermGroup =
  | 'lichun-yushui'
  | 'jingzhe-chunfen'
  | 'qingming-guyu'
  | 'lixia-xiaoman'
  | 'mangzhong-xiazhi'
  | 'xiaoshu-dashu'
  | 'liqiu-chushu'
  | 'bailu-qiufen'
  | 'hanlu-shuangjiang'
  | 'lidong-xiaoxue'
  | 'daxue-dongzhi'
  | 'xiaohan-dahan';

const SOLAR_TERM_SENTENCES: Record<SolarTermGroup, string> = {
  'lichun-yushui': '今日春气初动。有些感觉可以慢慢出来。',
  'jingzhe-chunfen': '今日雷声起。如果你心里有动静，那是天地在动。',
  'qingming-guyu': '今日雨润草木。有些感觉来了，也可以走。',
  'lixia-xiaoman': '今日天气渐暖。如果你觉得热，那是夏天在敲门。',
  'mangzhong-xiazhi': '今日日头最长。如果你觉得累，可以歇一歇。',
  'xiaoshu-dashu': '今日暑气重。不想动，就不动。',
  'liqiu-chushu': '今日凉意起。如果你有些感伤，那是秋天在酝酿。',
  'bailu-qiufen': '今日昼夜平。如果你心里两难，天地也是这样。',
  'hanlu-shuangjiang': '今日露成霜。如果你想一个人待着，可以。',
  'lidong-xiaoxue': '今日冬气藏。如果你不想说话，冬天也这样。',
  'daxue-dongzhi': '今日夜最长。在最暗的时候，光在回来的路上。',
  'xiaohan-dahan': '今日寒气重。如果你觉得冷，可以慢慢等。',
};

const SOLAR_TERM_LABELS: Record<SolarTermGroup, string> = {
  'lichun-yushui': '立春至雨水',
  'jingzhe-chunfen': '惊蛰至春分',
  'qingming-guyu': '清明至谷雨',
  'lixia-xiaoman': '立夏至小满',
  'mangzhong-xiazhi': '芒种至夏至',
  'xiaoshu-dashu': '小暑至大暑',
  'liqiu-chushu': '立秋至处暑',
  'bailu-qiufen': '白露至秋分',
  'hanlu-shuangjiang': '寒露至霜降',
  'lidong-xiaoxue': '立冬至小雪',
  'daxue-dongzhi': '大雪至冬至',
  'xiaohan-dahan': '小寒至大寒',
};

export function getSolarTermGroup(date: Date = new Date()): SolarTermGroup {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const md = m * 100 + d;

  // 各节气大致始日：立春2/4 惊蛰3/6 清明4/5 立夏5/6 芒种6/6 小暑7/7
  // 立秋8/8 白露9/8 寒露10/8 立冬11/8 大雪12/7 小寒1/6
  if (md >= 204 && md < 306) return 'lichun-yushui';
  if (md >= 306 && md < 405) return 'jingzhe-chunfen';
  if (md >= 405 && md < 506) return 'qingming-guyu';
  if (md >= 506 && md < 606) return 'lixia-xiaoman';
  if (md >= 606 && md < 707) return 'mangzhong-xiazhi';
  if (md >= 707 && md < 808) return 'xiaoshu-dashu';
  if (md >= 808 && md < 908) return 'liqiu-chushu';
  if (md >= 908 && md < 1008) return 'bailu-qiufen';
  if (md >= 1008 && md < 1108) return 'hanlu-shuangjiang';
  if (md >= 1108 && md < 1207) return 'lidong-xiaoxue';
  if (md >= 1207 || md < 106) return 'daxue-dongzhi';
  return 'xiaohan-dahan'; // 1/6 ~ 2/4
}

export function getSolarTermSentence(date: Date = new Date()) {
  const group = getSolarTermGroup(date);
  return {
    group,
    label: SOLAR_TERM_LABELS[group],
    sentence: SOLAR_TERM_SENTENCES[group],
  };
}

export type TimeOfDay = 'dawn' | 'morning' | 'noon' | 'afternoon' | 'dusk' | 'night';

const TIME_OF_DAY_SENTENCES: Record<TimeOfDay, string> = {
  dawn: '天刚亮。可以慢慢来。',
  morning: '光变亮了。有什么想做的，可以试试。',
  noon: '光最亮。觉得刺眼的话，可以找片阴凉。',
  afternoon: '光变斜了。有些感觉可以放一放。',
  dusk: '天渐暗。有些感觉可以回家了。',
  night: '夜已深。如果你还醒着，夜在陪你。',
};

const TIME_OF_DAY_LABELS: Record<TimeOfDay, string> = {
  dawn: '清晨',
  morning: '上午',
  noon: '正午',
  afternoon: '下午',
  dusk: '傍晚',
  night: '深夜',
};

export function getTimeOfDay(date: Date = new Date()): TimeOfDay {
  const h = date.getHours();
  if (h >= 5 && h < 8) return 'dawn';
  if (h >= 8 && h < 11) return 'morning';
  if (h >= 11 && h < 14) return 'noon';
  if (h >= 14 && h < 17) return 'afternoon';
  if (h >= 17 && h < 20) return 'dusk';
  return 'night';
}

export function getTimeOfDaySentence(date: Date = new Date()) {
  const tod = getTimeOfDay(date);
  return {
    tod,
    label: TIME_OF_DAY_LABELS[tod],
    sentence: TIME_OF_DAY_SENTENCES[tod],
  };
}

export type BirthSeason = 'spring' | 'summer' | 'autumn' | 'winter';

export function getBirthSeason(birthDate: string): BirthSeason {
  const m = parseInt(birthDate.split('-')[1] || '1', 10);
  if (m >= 3 && m <= 5) return 'spring';
  if (m >= 6 && m <= 8) return 'summer';
  if (m >= 9 && m <= 11) return 'autumn';
  return 'winter';
}
