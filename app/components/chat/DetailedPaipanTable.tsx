'use client';

import { calculateDetailedPaipan } from '@/app/lib/bazi/calculator';
import { getWuxing, wuxingColor } from '@/app/components/WuXing';
import type { Paipan } from '@/app/lib/chat/types';

interface DetailedPaipanTableProps {
  paipan: Paipan;
}

// Binary semantic palette: friendly (协同) vs hostile (对抗).
// Eight-way Tailwind palette violated DESIGN.md and overwhelmed the table.
type RelationTone = 'friendly' | 'hostile' | 'neutral';

function relationTone(label: string): RelationTone {
  if (/(冲|刑|害)/.test(label)) return 'hostile';
  if (/(合|会)/.test(label)) return 'friendly';
  return 'neutral';
}

const TONE_STYLE: Record<RelationTone, React.CSSProperties> = {
  friendly: {
    color: 'var(--color-gold-dark)',
    background: 'var(--color-gold-glow)',
    borderColor: 'color-mix(in oklch, var(--color-gold) 30%, transparent)',
  },
  hostile: {
    color: 'var(--color-primary)',
    background: 'var(--color-primary-glow)',
    borderColor: 'var(--color-border-accent)',
  },
  neutral: {
    color: 'var(--color-text-secondary)',
    background: 'var(--color-bg)',
    borderColor: 'var(--color-border)',
  },
};

function RelationTag({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-[var(--radius-md)] border text-xs font-medium"
      style={TONE_STYLE[relationTone(label)]}
    >
      {label}
    </span>
  );
}

const DAY_HIGHLIGHT = 'bg-[var(--color-primary-glow)]';

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
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-sm)] overflow-hidden">
      {/* Hairline gold accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-[var(--color-gold)] to-transparent opacity-50" />

      <div className="px-4 pt-3 pb-2">
        <h3 className="font-serif text-sm font-semibold text-[var(--color-text-primary)] tracking-wide">
          详细排盘
        </h3>
      </div>

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
                    idx === 2
                      ? `${DAY_HIGHLIGHT} text-[var(--color-primary)]`
                      : 'bg-[var(--color-bg)] text-[var(--color-text-muted)]'
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
                <td key={idx} className={`px-3 py-2 text-center ${idx === 2 ? DAY_HIGHLIGHT : ''}`}>
                  <span
                    className="text-lg font-bold font-serif"
                    style={{ color: wuxingColor(getWuxing(pillar.gan)) }}
                  >
                    {pillar.gan}
                  </span>
                </td>
              ))}
            </tr>

            {/* 地支 */}
            <tr className="border-b border-[var(--color-border-subtle)]">
              <td className="px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)]">地支</td>
              {pillars.map((pillar, idx) => (
                <td key={idx} className={`px-3 py-2 text-center ${idx === 2 ? DAY_HIGHLIGHT : ''}`}>
                  <span
                    className="text-lg font-bold font-serif"
                    style={{ color: wuxingColor(getWuxing(pillar.zhi)) }}
                  >
                    {pillar.zhi}
                  </span>
                </td>
              ))}
            </tr>

            {/* 藏干 */}
            <tr className="border-b border-[var(--color-border-subtle)]">
              <td className="px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)]">藏干</td>
              {[cang_gan.year, cang_gan.month, cang_gan.day, cang_gan.hour].map((cg, idx) => (
                <td key={idx} className={`px-3 py-2 text-center text-xs ${idx === 2 ? DAY_HIGHLIGHT : ''}`}>
                  {cg.map((gan, i) => {
                    const el = getWuxing(gan);
                    return (
                      <span key={i} style={{ color: wuxingColor(el) }}>
                        {gan}{el && `(${el})`}{i < cg.length - 1 ? ' ' : ''}
                      </span>
                    );
                  })}
                </td>
              ))}
            </tr>

            {/* 十神（天干）*/}
            <tr className="border-b border-[var(--color-border-subtle)]">
              <td className="px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)]">十神（天干）</td>
              <td className="px-3 py-2 text-center text-xs">{shi_shen_gan.year}</td>
              <td className="px-3 py-2 text-center text-xs">{shi_shen_gan.month}</td>
              <td className={`px-3 py-2 text-center text-xs ${DAY_HIGHLIGHT}`}>{shi_shen_gan.day}</td>
              <td className="px-3 py-2 text-center text-xs">{shi_shen_gan.hour}</td>
            </tr>

            {/* 十神（地支）*/}
            <tr className="border-b border-[var(--color-border-subtle)]">
              <td className="px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)]">十神（地支）</td>
              <td className="px-3 py-2 text-center text-xs">{shi_shen_zhi.year}</td>
              <td className="px-3 py-2 text-center text-xs">{shi_shen_zhi.month}</td>
              <td className={`px-3 py-2 text-center text-xs ${DAY_HIGHLIGHT}`}>{shi_shen_zhi.day}</td>
              <td className="px-3 py-2 text-center text-xs">{shi_shen_zhi.hour}</td>
            </tr>

            {/* 十二长生 */}
            <tr className="border-b border-[var(--color-border-subtle)]">
              <td className="px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)]">十二长生</td>
              <td className="px-3 py-2 text-center text-xs">{chang_sheng.year}</td>
              <td className="px-3 py-2 text-center text-xs">{chang_sheng.month}</td>
              <td className={`px-3 py-2 text-center text-xs ${DAY_HIGHLIGHT}`}>{chang_sheng.day}</td>
              <td className="px-3 py-2 text-center text-xs">{chang_sheng.hour}</td>
            </tr>

            {/* 纳音 */}
            <tr className="border-b border-[var(--color-border-subtle)]">
              <td className="px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)]">纳音</td>
              <td className="px-3 py-2 text-center text-xs">{na_yin.year}</td>
              <td className="px-3 py-2 text-center text-xs">{na_yin.month}</td>
              <td className={`px-3 py-2 text-center text-xs ${DAY_HIGHLIGHT}`}>{na_yin.day}</td>
              <td className="px-3 py-2 text-center text-xs">{na_yin.hour}</td>
            </tr>

            {/* 空亡 */}
            <tr>
              <td className="px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)]">空亡</td>
              <td colSpan={4} className="px-3 py-2 text-center text-xs text-[var(--color-text-body)]">
                {xun_kong || '无'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {hasRelations && (
        <div className="px-4 py-3 border-t border-[var(--color-border-subtle)] flex flex-wrap gap-1.5">
          {allRelations.map((r, i) => <RelationTag key={i} label={r} />)}
        </div>
      )}
    </div>
  );
}
