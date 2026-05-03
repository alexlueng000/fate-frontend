'use client';

import { calculateDetailedPaipan } from '@/app/lib/bazi/calculator';
import { getWuxing } from '@/app/components/WuXing';
import type { Paipan } from '@/app/lib/chat/types';

interface DetailedPaipanTableProps {
  paipan: Paipan;
}

const getWuxingColor = (char: string) => {
  const wuxing = getWuxing(char);
  if (!wuxing) return 'text-[var(--color-text-primary)]';
  const colorMap: Record<string, string> = {
    木: 'text-emerald-600',
    火: 'text-red-600',
    土: 'text-amber-600',
    金: 'text-yellow-600',
    水: 'text-sky-600',
  };
  return colorMap[wuxing];
};

// 关系标签颜色
const RELATION_COLORS: Record<string, string> = {
  冲: 'bg-red-50 text-red-700 border-red-200',
  合: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  刑: 'bg-orange-50 text-orange-700 border-orange-200',
  害: 'bg-purple-50 text-purple-700 border-purple-200',
  三合: 'bg-blue-50 text-blue-700 border-blue-200',
  三会: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  半合: 'bg-blue-50 text-blue-600 border-blue-100',
  天干合: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  天干冲: 'bg-red-50 text-red-700 border-red-200',
};

function getRelationColor(label: string): string {
  if (label.includes('三会')) return RELATION_COLORS['三会'];
  if (label.includes('三合') && !label.includes('半')) return RELATION_COLORS['三合'];
  if (label.includes('半合')) return RELATION_COLORS['半合'];
  if (label.includes('冲') && !label.includes('天干')) return RELATION_COLORS['冲'];
  if (label.includes('合') && !label.includes('半') && !label.includes('三')) return RELATION_COLORS['合'];
  if (label.includes('刑')) return RELATION_COLORS['刑'];
  if (label.includes('害')) return RELATION_COLORS['害'];
  return 'bg-neutral-50 text-neutral-600 border-neutral-200';
}

function RelationTag({ label }: { label: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium ${getRelationColor(label)}`}>
      {label}
    </span>
  );
}

export function DetailedPaipanTable({ paipan }: DetailedPaipanTableProps) {
  const detailed = calculateDetailedPaipan(paipan);
  const {
    four_pillars, cang_gan, shi_shen_gan, shi_shen_zhi,
    chang_sheng, xun_kong, na_yin,
    dizhi_relations, tiangan_relations,
  } = detailed;

  const pillars = [
    { name: '年柱', gan: four_pillars.year[0], zhi: four_pillars.year[1] },
    { name: '月柱', gan: four_pillars.month[0], zhi: four_pillars.month[1] },
    { name: '日柱', gan: four_pillars.day[0], zhi: four_pillars.day[1] },
    { name: '时柱', gan: four_pillars.hour[0], zhi: four_pillars.hour[1] },
  ];

  const hasRelations =
    dizhi_relations.chong.length > 0 ||
    dizhi_relations.he.length > 0 ||
    dizhi_relations.sanhe.length > 0 ||
    dizhi_relations.sanhui.length > 0 ||
    dizhi_relations.xing.length > 0 ||
    dizhi_relations.hai.length > 0 ||
    tiangan_relations.he.length > 0 ||
    tiangan_relations.chong.length > 0;

  const allRelations = [
    ...tiangan_relations.he.map(t => t + '（天干）'),
    ...tiangan_relations.chong.map(t => t + '（天干）'),
    ...dizhi_relations.chong,
    ...dizhi_relations.he,
    ...dizhi_relations.sanhe,
    ...dizhi_relations.sanhui,
    ...dizhi_relations.xing,
    ...dizhi_relations.hai,
  ];

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-sm overflow-hidden">
      {/* 顶部金色装饰线 */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-[var(--color-gold)] to-transparent opacity-60" />

      {/* 标题栏 */}
      <div className="px-4 pt-3 pb-2">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] tracking-wide">
          详细排盘
        </h3>
      </div>

      {/* 表格 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th className="px-3 py-2 text-left text-xs font-medium text-[var(--color-text-muted)] bg-[var(--color-bg)]">
                项目
              </th>
              {pillars.map((pillar, idx) => (
                <th
                  key={idx}
                  className={`px-3 py-2 text-center text-xs font-medium ${
                    idx === 2 ? 'bg-amber-50 text-amber-800' : 'bg-[var(--color-bg)] text-[var(--color-text-muted)]'
                  }`}
                >
                  {pillar.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* 天干 */}
            <tr className="border-b border-[var(--color-border-subtle)]">
              <td className="px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)]">天干</td>
              {pillars.map((pillar, idx) => (
                <td key={idx} className={`px-3 py-2 text-center ${idx === 2 ? 'bg-amber-50/30' : ''}`}>
                  <span className={`text-lg font-bold ${getWuxingColor(pillar.gan)}`}>
                    {pillar.gan}
                  </span>
                </td>
              ))}
            </tr>

            {/* 地支 */}
            <tr className="border-b border-[var(--color-border-subtle)]">
              <td className="px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)]">地支</td>
              {pillars.map((pillar, idx) => (
                <td key={idx} className={`px-3 py-2 text-center ${idx === 2 ? 'bg-amber-50/30' : ''}`}>
                  <span className={`text-lg font-bold ${getWuxingColor(pillar.zhi)}`}>
                    {pillar.zhi}
                  </span>
                </td>
              ))}
            </tr>

            {/* 藏干 */}
            <tr className="border-b border-[var(--color-border-subtle)]">
              <td className="px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)]">藏干</td>
              {[cang_gan.year, cang_gan.month, cang_gan.day, cang_gan.hour].map((cg, idx) => (
                <td key={idx} className={`px-3 py-2 text-center text-xs ${idx === 2 ? 'bg-amber-50/30' : ''}`}>
                  {cg.map((gan, i) => (
                    <span key={i} className={getWuxingColor(gan)}>
                      {gan}{getWuxing(gan) && `(${getWuxing(gan)})`}{i < cg.length - 1 ? ' ' : ''}
                    </span>
                  ))}
                </td>
              ))}
            </tr>

            {/* 十神（天干）*/}
            <tr className="border-b border-[var(--color-border-subtle)]">
              <td className="px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)]">十神（天干）</td>
              <td className="px-3 py-2 text-center text-xs">{shi_shen_gan.year}</td>
              <td className="px-3 py-2 text-center text-xs">{shi_shen_gan.month}</td>
              <td className="px-3 py-2 text-center text-xs bg-amber-50/30">{shi_shen_gan.day}</td>
              <td className="px-3 py-2 text-center text-xs">{shi_shen_gan.hour}</td>
            </tr>

            {/* 十神（地支）*/}
            <tr className="border-b border-[var(--color-border-subtle)]">
              <td className="px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)]">十神（地支）</td>
              <td className="px-3 py-2 text-center text-xs">{shi_shen_zhi.year}</td>
              <td className="px-3 py-2 text-center text-xs">{shi_shen_zhi.month}</td>
              <td className="px-3 py-2 text-center text-xs bg-amber-50/30">{shi_shen_zhi.day}</td>
              <td className="px-3 py-2 text-center text-xs">{shi_shen_zhi.hour}</td>
            </tr>

            {/* 十二长生 */}
            <tr className="border-b border-[var(--color-border-subtle)]">
              <td className="px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)]">十二长生</td>
              <td className="px-3 py-2 text-center text-xs">{chang_sheng.year}</td>
              <td className="px-3 py-2 text-center text-xs">{chang_sheng.month}</td>
              <td className="px-3 py-2 text-center text-xs bg-amber-50/30">{chang_sheng.day}</td>
              <td className="px-3 py-2 text-center text-xs">{chang_sheng.hour}</td>
            </tr>

            {/* 纳音 */}
            <tr className="border-b border-[var(--color-border-subtle)]">
              <td className="px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)]">纳音</td>
              <td className="px-3 py-2 text-center text-xs">{na_yin.year}</td>
              <td className="px-3 py-2 text-center text-xs">{na_yin.month}</td>
              <td className="px-3 py-2 text-center text-xs bg-amber-50/30">{na_yin.day}</td>
              <td className="px-3 py-2 text-center text-xs">{na_yin.hour}</td>
            </tr>

            {/* 空亡 */}
            <tr>
              <td className="px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)]">空亡</td>
              <td colSpan={4} className="px-3 py-2 text-center text-xs">
                {xun_kong || '无'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
}
