'use client';
import { useMemo } from 'react';

export function PrettyDateField({
  label = '出生日期',
  value,
  onChange,
  min,
  max,
  placeholder = '年 / 月 / 日',
  disabled = false,
  showPresets = true,
  helper = '不确定日期？先留空也可以，稍后仍可补充。',
}: {
  label?: string;
  value: string;                         // 'YYYY-MM-DD' 或 ''
  onChange: (v: string) => void;
  min?: string;                          // 'YYYY-MM-DD'
  max?: string;                          // 'YYYY-MM-DD'
  placeholder?: string;
  disabled?: boolean;
  showPresets?: boolean;
  helper?: string;
}) {
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const isClearable = !!value;

  return (
    <div className="space-y-1.5">
      {/* <label className="block text-sm text-neutral-700">{label}</label> */}

      <div className="relative">
        {/* 左侧图标 */}
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-red-600/70">
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="currentColor" d="M7 2h2v2h6V2h2v2h3v18H4V4h3V2zm13 6H4v12h16V8zM6 10h5v5H6v-5z"/>
          </svg>
        </span>

        {/* 原生 date，稳定可靠 */}
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max ?? today}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full rounded-xl border border-[#f0d9a6] bg-[#fff7ed] pl-9 pr-9 py-2 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-60"
          aria-label={label}
        />

        {/* 清空按钮 */}
        {isClearable && !disabled && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-neutral-500 hover:bg-red-100/60"
            aria-label="清除日期"
            title="清除"
          >
            <svg width="14" height="14" viewBox="0 0 24 24">
              <path fill="currentColor" d="M18.3 5.7L12 12l6.3 6.3l-1.4 1.4L10.6 13.4L4.3 19.7L2.9 18.3L9.2 12L2.9 5.7L4.3 4.3l6.3 6.3l6.3-6.3z"/>
            </svg>
          </button>
        )}
      </div>

      {/* 快捷日期（可关） */}
      {/* {showPresets && (
        <div className="flex flex-wrap gap-2 pt-1">
          <PresetBtn text="今天" onClick={() => onChange(today)} />
          <PresetBtn text="昨天" onClick={() => onChange(offsetDate(-1))} />
          <PresetBtn text="一周前" onClick={() => onChange(offsetDate(-7))} />
        </div>
      )}

      {helper && <p className="text-xs text-neutral-600">{helper}</p>} */}
    </div>
  );
}

function PresetBtn({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-[#f0d9a6] bg-white/80 px-3 py-1 text-xs text-neutral-700 hover:bg-[#fff3e0] transition"
    >
      {text}
    </button>
  );
}

function offsetDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
