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
    <div className="grid gap-3 sm:grid-cols-2">
      {/* 出生日期 */}
      <div className="relative">
        <label className="mb-1 block text-sm text-neutral-700">出生日期</label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-red-600/70">
            <Calendar className="h-4 w-4" />
          </span>
          <PrettyDateField
            value={birthDate}
            onChange={setBirthDate}
            max={today}
            // aria-label="出生日期"
          />
          {/* {birthDate && (
            <button
              type="button"
              onClick={() => setBirthDate('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-neutral-500 hover:bg-red-100/60"
              aria-label="清除出生日期"
              title="清除"
            >
              <X className="h-4 w-4" />
            </button>
          )} */}
        </div>
        {/* <p className="mt-1 text-xs text-neutral-600">不确定日期？先留空也可以，稍后仍可补充。</p> */}
      </div>

      {/* 出生时间 */}
      <div className="relative">
        <label className="mb-1 block text-sm text-neutral-700">出生时间</label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-red-600/70">
            <Clock className="h-4 w-4" />
          </span>
          <TimePicker value={birthTime} onChange={setBirthTime} attachToBody />
        </div>

      </div>
    </div>
  );
}
