'use client';


/* ===== 子组件 ===== */
export function Pill({ label, value }: { label: string; value: string }) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
        <div className="text-[11px] text-neutral-400">{label}</div>
        <div className="mt-0.5 text-sm font-semibold text-white">{value || '—'}</div>
      </div>
    );
  }
  
  export function Bar({ name, percent }: { name: string; percent: number }) {
    return (
      <div>
        <div className="flex items-center justify-between text-xs text-neutral-300">
          <span>{name}</span>
          <span>{percent}%</span>
        </div>
        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    );
  }
  
  export function DayunChip({ age, year, pillar }: { age: number; year: number; pillar: string }) {
    return (
      <div className="shrink-0 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-neutral-200">
        <div>
          起运年龄：<span className="text-white font-medium">{age}</span>
        </div>
        <div>
          起运年份：<span className="text-white font-medium">{year}</span>
        </div>
        <div className="mt-1">
          大运：<span className="font-semibold">{pillar || '—'}</span>
        </div>
      </div>
    );
  }
  

// ===== 五行 & 着色工具 =====
type Wuxing = '木' | '火' | '土' | '金' | '水';

const GAN_WUXING: Record<string, Wuxing> = {
  甲: '木', 乙: '木',
  丙: '火', 丁: '火',
  戊: '土', 己: '土',
  庚: '金', 辛: '金',
  壬: '水', 癸: '水',
};

const ZHI_WUXING: Record<string, Wuxing> = {
  子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火',
  午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水',
};

export function getWuxing(char: string): Wuxing | null {
  if (!char) return null;
  return (GAN_WUXING[char] as Wuxing) || (ZHI_WUXING[char] as Wuxing) || null;
}

export function colorClasses(el: Wuxing, variant: 'text' | 'bg' | 'border' = 'text') {
  const map: Record<Wuxing, { text: string; bg: string; border: string }> = {
    木: { text: 'text-emerald-800', bg: 'bg-emerald-100', border: 'border-emerald-200' },
    火: { text: 'text-red-800',     bg: 'bg-red-100',     border: 'border-red-200' },
    土: { text: 'text-amber-800',   bg: 'bg-amber-100',   border: 'border-amber-200' },
    金: { text: 'text-yellow-800',  bg: 'bg-yellow-100',  border: 'border-yellow-200' },
    水: { text: 'text-sky-800',     bg: 'bg-sky-100',     border: 'border-sky-200' },
  };
  return map[el][variant];
}

export function WuxingBadge({ char }: { char: string }) {
  const el = getWuxing(char);
  if (!el) return <span className="px-2 py-1 rounded-lg border border-red-200 bg-white text-neutral-900">{char || '—'}</span>;
  return (
    <span className={`px-2 py-1 rounded-lg border ${colorClasses(el,'border')} ${colorClasses(el,'bg')} ${colorClasses(el,'text')} font-semibold`}>
      {char}
      <span className="ml-1 text-xs opacity-80">({el})</span>
    </span>
  );
}

export function WuxingBar({ name, percent }: { name: Wuxing; percent: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm font-medium text-neutral-800">
        <span className={`${colorClasses(name,'text')} font-semibold`}>{name}</span>
        <span>{percent}%</span>
      </div>
      <div className={`h-2 w-full overflow-hidden rounded-full ${colorClasses(name,'bg')} border ${colorClasses(name,'border')}`}>
        <div
          className={`h-full ${colorClasses(name,'text').replace('text-','bg-')} transition-all`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
