'use client';

const PILLARS = [
  { label: '年柱', tian: '甲', di: '子', tian_wx: 'wood', di_wx: 'water' },
  { label: '月柱', tian: '丁', di: '卯', tian_wx: 'fire', di_wx: 'wood' },
  { label: '日柱', tian: '庚', di: '午', tian_wx: 'metal', di_wx: 'fire' },
  { label: '时柱', tian: '壬', di: '戌', tian_wx: 'water', di_wx: 'earth' },
];

const WX_COLOR: Record<string, string> = {
  wood: '#059669',
  fire: '#DC2626',
  earth: '#D97706',
  metal: '#6B7280',
  water: '#0284C7',
};

const WX_BG: Record<string, string> = {
  wood: 'rgba(16,185,129,0.08)',
  fire: 'rgba(239,68,68,0.08)',
  earth: 'rgba(245,158,11,0.08)',
  metal: 'rgba(107,114,128,0.08)',
  water: 'rgba(14,165,233,0.08)',
};

export default function BaziPreview() {
  return (
    <div className="space-y-4">
      <div className="text-xs text-[var(--color-text-muted)] text-center mb-2">示例命盘</div>

      {/* 四柱 */}
      <div className="grid grid-cols-4 gap-2">
        {PILLARS.map((p) => (
          <div key={p.label} className="flex flex-col items-center gap-1">
            <div className="text-xs text-[var(--color-text-muted)]">{p.label}</div>
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold"
              style={{ background: WX_BG[p.tian_wx], color: WX_COLOR[p.tian_wx] }}
            >
              {p.tian}
            </div>
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold"
              style={{ background: WX_BG[p.di_wx], color: WX_COLOR[p.di_wx] }}
            >
              {p.di}
            </div>
          </div>
        ))}
      </div>

      {/* 大运时间轴 */}
      <div className="mt-4">
        <div className="text-xs text-[var(--color-text-muted)] mb-2">大运流年</div>
        <div className="flex gap-1 overflow-hidden">
          {['22岁', '32岁', '42岁', '52岁', '62岁'].map((age, i) => (
            <div
              key={age}
              className="flex-1 text-center py-1.5 rounded text-xs font-medium"
              style={{
                background: i === 1 ? 'var(--color-primary)' : 'var(--color-bg-deep)',
                color: i === 1 ? 'white' : 'var(--color-text-secondary)',
              }}
            >
              {age}
            </div>
          ))}
        </div>
        <div className="text-xs text-[var(--color-text-hint)] text-center mt-1">▲ 当前大运</div>
      </div>

      {/* 五行能量条 */}
      <div className="mt-4 space-y-1.5">
        <div className="text-xs text-[var(--color-text-muted)] mb-2">五行分布</div>
        {[
          { label: '木', pct: 25, wx: 'wood' },
          { label: '火', pct: 38, wx: 'fire' },
          { label: '土', pct: 12, wx: 'earth' },
          { label: '金', pct: 13, wx: 'metal' },
          { label: '水', pct: 12, wx: 'water' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className="text-xs w-4" style={{ color: WX_COLOR[item.wx] }}>{item.label}</span>
            <div className="flex-1 h-1.5 bg-[var(--color-bg-deep)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${item.pct}%`, background: WX_COLOR[item.wx] }}
              />
            </div>
            <span className="text-xs text-[var(--color-text-hint)] w-7 text-right">{item.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
