import { getCangGan } from './canggan';
import { getShiShen } from './shishen';
import { getChangSheng } from './changsheng';
import { getNaYin } from './nayin';
import { getXunKong } from './xunkong';
import { getDizhiRelations, getTianganRelations } from './dizhi_relations';
import type { DizhiRelations, TianganRelations } from './dizhi_relations';
import type { Paipan } from '@/app/lib/chat/types';

export type { DizhiRelations, TianganRelations };

export interface DetailedPaipan extends Paipan {
  cang_gan: {
    year: string[];
    month: string[];
    day: string[];
    hour: string[];
  };
  shi_shen_gan: {
    year: string;
    month: string;
    day: string;
    hour: string;
  };
  shi_shen_zhi: {
    year: string;
    month: string;
    day: string;
    hour: string;
  };
  chang_sheng: {
    year: string;
    month: string;
    day: string;
    hour: string;
  };
  xun_kong: string;
  na_yin: {
    year: string;
    month: string;
    day: string;
    hour: string;
  };
  dizhi_relations: DizhiRelations;
  tiangan_relations: TianganRelations;
}

export function calculateDetailedPaipan(paipan: Paipan): DetailedPaipan {
  const { four_pillars } = paipan;
  const dayGan = four_pillars.day[0];
  const dayZhi = four_pillars.day[1];

  return {
    ...paipan,
    // 藏干
    cang_gan: {
      year: getCangGan(four_pillars.year[1]),
      month: getCangGan(four_pillars.month[1]),
      day: getCangGan(four_pillars.day[1]),
      hour: getCangGan(four_pillars.hour[1]),
    },
    // 十神（天干）
    shi_shen_gan: {
      year: getShiShen(dayGan, four_pillars.year[0]),
      month: getShiShen(dayGan, four_pillars.month[0]),
      day: getShiShen(dayGan, four_pillars.day[0]),
      hour: getShiShen(dayGan, four_pillars.hour[0]),
    },
    // 十神（地支藏干主气）
    shi_shen_zhi: {
      year: getShiShen(dayGan, getCangGan(four_pillars.year[1])[0] || ''),
      month: getShiShen(dayGan, getCangGan(four_pillars.month[1])[0] || ''),
      day: getShiShen(dayGan, getCangGan(four_pillars.day[1])[0] || ''),
      hour: getShiShen(dayGan, getCangGan(four_pillars.hour[1])[0] || ''),
    },
    // 十二长生（各柱用自己的天干查本柱地支）
    chang_sheng: {
      year: getChangSheng(four_pillars.year[0], four_pillars.year[1]),
      month: getChangSheng(four_pillars.month[0], four_pillars.month[1]),
      day: getChangSheng(four_pillars.day[0], four_pillars.day[1]),
      hour: getChangSheng(four_pillars.hour[0], four_pillars.hour[1]),
    },
    // 空亡
    xun_kong: getXunKong(dayGan, dayZhi),
    // 纳音
    na_yin: {
      year: getNaYin(four_pillars.year[0], four_pillars.year[1]),
      month: getNaYin(four_pillars.month[0], four_pillars.month[1]),
      day: getNaYin(four_pillars.day[0], four_pillars.day[1]),
      hour: getNaYin(four_pillars.hour[0], four_pillars.hour[1]),
    },
    // 地支关系
    dizhi_relations: getDizhiRelations([
      four_pillars.year[1],
      four_pillars.month[1],
      four_pillars.day[1],
      four_pillars.hour[1],
    ]),
    // 天干关系
    tiangan_relations: getTianganRelations([
      four_pillars.year[0],
      four_pillars.month[0],
      four_pillars.day[0],
      four_pillars.hour[0],
    ]),
  };
}
