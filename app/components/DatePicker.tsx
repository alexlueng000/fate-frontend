'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DateTimeTheme, dateTimeThemes } from './form/dateTimeThemes';

const pad = (n: number) => String(n).padStart(2, '0');

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

type IOSWheelDateProps = {
  value: string;                    // 'YYYY-MM-DD' | ''
  onChange: (v: string) => void;
  placeholder?: string;             // '年 / 月 / 日'
  disabled?: boolean;
  min?: string;                     // 最小日期
  max?: string;                     // 最大日期 (默认今天)
  attachToBody?: boolean;
  theme?: DateTimeTheme;
};

export function IOSWheelDate({
  value,
  onChange,
  placeholder = '年 / 月 / 日',
  disabled = false,
  min,
  max,
  attachToBody = true,
  theme = 'panel',
}: IOSWheelDateProps) {
  const themeConfig = dateTimeThemes[theme];
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);

  const today = new Date();
  const currentYear = today.getFullYear();
  const maxDate = max ? new Date(max) : today;
  const minDate = min ? new Date(min) : new Date(1900, 0, 1);

  const [open, setOpen] = useState(false);
  const [y, setY] = useState<number>(() => {
    if (value) {
      const parts = value.split('-');
      return Number(parts[0]) || currentYear;
    }
    return currentYear;
  });
  const [m, setM] = useState<number>(() => {
    if (value) {
      const parts = value.split('-');
      return Number(parts[1]) || 1;
    }
    return today.getMonth() + 1;
  });
  const [d, setD] = useState<number>(() => {
    if (value) {
      const parts = value.split('-');
      return Number(parts[2]) || 1;
    }
    return today.getDate();
  });

  // 触发器位置 → 弹层绝对定位
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  useEffect(() => {
    if (!open) return;
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const width = Math.max(320, r.width);
    const left = Math.min(
      Math.max(8, r.left + window.scrollX),
      window.scrollX + document.documentElement.clientWidth - width - 8
    );
    setRect({ top: r.bottom + window.scrollY + 6, left, width });
  }, [open]);

  // 点击外部 / Esc 关闭
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (popupRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  // 年份范围
  const years = useMemo(() => {
    const arr: number[] = [];
    for (let i = minDate.getFullYear(); i <= maxDate.getFullYear(); i++) arr.push(i);
    return arr;
  }, [minDate, maxDate]);

  // 月份 1-12
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);

  // 当月天数
  const days = useMemo(() => {
    const maxDay = getDaysInMonth(y, m);
    return Array.from({ length: maxDay }, (_, i) => i + 1);
  }, [y, m]);

  // 当年月变化时，自动调整日期
  useEffect(() => {
    const maxDay = getDaysInMonth(y, m);
    if (d > maxDay) {
      setD(maxDay);
    }
  }, [y, m, d]);

  // === iOS Wheel 基本参数 ===
  const ROW_H = 36;
  const VISIBLE = 5;
  const VIEW_H = ROW_H * VISIBLE;

  const colYRef = useRef<HTMLDivElement | null>(null);
  const colMRef = useRef<HTMLDivElement | null>(null);
  const colDRef = useRef<HTMLDivElement | null>(null);

  // 打开时滚到当前值
  useEffect(() => {
    if (!open) return;
    const yIdx = years.indexOf(y);
    colYRef.current?.scrollTo({ top: Math.max(0, yIdx) * ROW_H });
    colMRef.current?.scrollTo({ top: (m - 1) * ROW_H });
    colDRef.current?.scrollTo({ top: (d - 1) * ROW_H });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // 惯性后自动吸附
  function snap(el: HTMLElement, total: number) {
    const idx = Math.round(el.scrollTop / ROW_H);
    const clamped = Math.max(0, Math.min(total - 1, idx));
    el.scrollTo({ top: clamped * ROW_H, behavior: 'smooth' });
    return clamped;
  }
  function onScrollY(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    window.clearTimeout((el as any)._t);
    (el as any)._t = window.setTimeout(() => {
      const idx = snap(el, years.length);
      setY(years[idx]);
    }, 80);
  }
  function onScrollM(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    window.clearTimeout((el as any)._t);
    (el as any)._t = window.setTimeout(() => {
      const idx = snap(el, 12);
      setM(idx + 1);
    }, 80);
  }
  function onScrollD(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    window.clearTimeout((el as any)._t);
    (el as any)._t = window.setTimeout(() => {
      const idx = snap(el, days.length);
      setD(idx + 1);
    }, 80);
  }

  function confirm(ny = y, nm = m, nd = d) {
    onChange(`${ny}-${pad(nm)}-${pad(nd)}`);
    setOpen(false);
  }
  function clear() {
    onChange('');
    setY(currentYear);
    setM(today.getMonth() + 1);
    setD(today.getDate());
    setOpen(false);
  }

  const display = value
    ? `${value.split('-')[0]}年${value.split('-')[1]}月${value.split('-')[2]}日`
    : placeholder;

  // 弹层
  const popup = (
    <div
      ref={popupRef}
      className={`z-[9999] rounded-xl border ${themeConfig.popup}`}
      style={{ width: rect?.width ?? 320, ...(attachToBody && rect ? { position: 'absolute' as const, top: rect.top, left: rect.left } : {}) }}
    >
      <div className="flex items-center justify-between px-3 py-2">
        <div className="text-sm text-neutral-700">
          已选 <span className={`ml-1 ${themeConfig.selectedText}`}>{y}年{pad(m)}月{pad(d)}日</span>
        </div>
        <div className="flex gap-2">
          <button onClick={clear} className={`rounded-lg border px-2.5 py-1.5 text-xs ${themeConfig.popupButtonSecondary}`}>清空</button>
          <button onClick={() => confirm()} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${themeConfig.popupButton}`}>完成</button>
        </div>
      </div>

      <div className="relative px-3 pb-3">
        {/* 中线选中框 */}
        <div
          className={`pointer-events-none absolute left-3 right-3 top-1/2 -translate-y-1/2 rounded-lg border ${themeConfig.popupBorder} bg-transparent`}
          style={{ height: ROW_H }}
        />
        <div className="grid grid-cols-3 gap-2">
          {/* 年份列 */}
          <div>
            <div className="mb-1 text-xs text-neutral-600">年</div>
            <div
              ref={colYRef}
              onScroll={onScrollY}
              className={`font-mono overflow-auto rounded-lg border ${themeConfig.popupBorder} text-neutral-800`}
              style={{ height: VIEW_H, scrollSnapType: 'y mandatory' as const }}
            >
              <div style={{ height: (VIEW_H - ROW_H) / 2 }} />
              {years.map((yr) => (
                <div
                  key={yr}
                  style={{ height: ROW_H, lineHeight: `${ROW_H}px`, scrollSnapAlign: 'center' }}
                  className={`text-center text-sm ${yr === y ? themeConfig.selectedText : ''}`}
                  onClick={() => { setY(yr); confirm(yr, m, d); }}
                >
                  {yr}
                </div>
              ))}
              <div style={{ height: (VIEW_H - ROW_H) / 2 }} />
            </div>
          </div>
          {/* 月份列 */}
          <div>
            <div className="mb-1 text-xs text-neutral-600">月</div>
            <div
              ref={colMRef}
              onScroll={onScrollM}
              className={`font-mono overflow-auto rounded-lg border ${themeConfig.popupBorder} text-neutral-800`}
              style={{ height: VIEW_H, scrollSnapType: 'y mandatory' as const }}
            >
              <div style={{ height: (VIEW_H - ROW_H) / 2 }} />
              {months.map((mo) => (
                <div
                  key={mo}
                  style={{ height: ROW_H, lineHeight: `${ROW_H}px`, scrollSnapAlign: 'center' }}
                  className={`text-center text-sm ${mo === m ? themeConfig.selectedText : ''}`}
                  onClick={() => { setM(mo); confirm(y, mo, d); }}
                >
                  {pad(mo)}
                </div>
              ))}
              <div style={{ height: (VIEW_H - ROW_H) / 2 }} />
            </div>
          </div>
          {/* 日期列 */}
          <div>
            <div className="mb-1 text-xs text-neutral-600">日</div>
            <div
              ref={colDRef}
              onScroll={onScrollD}
              className={`font-mono overflow-auto rounded-lg border ${themeConfig.popupBorder} text-neutral-800`}
              style={{ height: VIEW_H, scrollSnapType: 'y mandatory' as const }}
            >
              <div style={{ height: (VIEW_H - ROW_H) / 2 }} />
              {days.map((day) => (
                <div
                  key={day}
                  style={{ height: ROW_H, lineHeight: `${ROW_H}px`, scrollSnapAlign: 'center' }}
                  className={`text-center text-sm ${day === d ? themeConfig.selectedText : ''}`}
                  onClick={() => { setD(day); confirm(y, m, day); }}
                >
                  {pad(day)}
                </div>
              ))}
              <div style={{ height: (VIEW_H - ROW_H) / 2 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`w-full rounded-xl text-left text-sm text-neutral-900 outline-none ${themeConfig.trigger} ${themeConfig.triggerPadding}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="选择日期"
      >
        {display}
      </button>

      {open && (attachToBody ? createPortal(popup, document.body) : <div className="absolute left-0 right-0 mt-2">{popup}</div>)}
    </div>
  );
}
