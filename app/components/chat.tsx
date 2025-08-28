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
  