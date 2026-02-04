'use client';
import { useMemo } from 'react';
import { IOSWheelDate } from './DatePicker';
import { DateTimeTheme } from './form/dateTimeThemes';

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
  theme = 'panel',
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
  theme?: DateTimeTheme;
}) {
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  return (
    <div className="space-y-1.5">
      <IOSWheelDate
        value={value}
        onChange={onChange}
        min={min}
        max={max ?? today}
        placeholder={placeholder}
        disabled={disabled}
        theme={theme}
        attachToBody
      />
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
