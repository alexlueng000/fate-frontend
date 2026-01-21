// 放在文件顶部或 components 中（注意：所在文件需要 'use client'）
import { useMemo } from 'react';
import { Calendar, Clock, X } from 'lucide-react';

import { IOSWheelTime as TimePicker } from '../TimePicker';
import { PrettyDateField } from '../Calender';

export function BirthDateTimeFields({
  birthDate,
  setBirthDate,
  birthTime,
  setBirthTime,
  showTimePresets = true,
}: {
  birthDate: string;
  setBirthDate: (v: string) => void;
  birthTime: string;
  setBirthTime: (v: string) => void;
  showTimePresets?: boolean;
}) {
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {/* 出生日期 */}
      <div className="relative">
        <label className="mb-1 block text-xs text-[var(--color-text-secondary)]">出生日期</label>
        <div className="relative">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-primary)]/60">
            <Calendar className="h-3.5 w-3.5" />
          </span>
          <PrettyDateField
            value={birthDate}
            onChange={setBirthDate}
            max={today}
          />
        </div>
      </div>

      {/* 出生时间 */}
      <div className="relative">
        <label className="mb-1 block text-xs text-[var(--color-text-secondary)]">出生时间</label>
        <div className="relative">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-primary)]/60">
            <Clock className="h-3.5 w-3.5" />
          </span>
          <TimePicker value={birthTime} onChange={setBirthTime} attachToBody />
        </div>
      </div>
    </div>
  );
}
