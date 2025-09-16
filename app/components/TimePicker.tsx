'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const pad = (n: number) => String(n).padStart(2, '0');

type IOSWheelTimeProps = {
  value: string;                         // 'HH:MM' | ''
  onChange: (v: string) => void;
  placeholder?: string;                  // '--:--'
  disabled?: boolean;
  minuteStep?: number;                   // 默认 1 → 0..59
  attachToBody?: boolean;                // 默认 true：弹层不撑布局
};

export function IOSWheelTime({
  value,
  onChange,
  placeholder = '--:--',
  disabled = false,
  minuteStep = 1,
  attachToBody = true,
}: IOSWheelTimeProps) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popupRef   = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [h, setH] = useState<number>(() => (value ? Number(value.split(':')[0]) : 12));
  const [m, setM] = useState<number>(() => (value ? Number(value.split(':')[1]) : 0));

  // 触发器位置 → 弹层绝对定位（不改变布局）
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  useEffect(() => {
    if (!open) return;
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const width = Math.max(240, r.width); // 最小宽度，避免拥挤
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

  // 分钟数组（0..59 或按步长）
  const minutes = useMemo(() => {
    const step = Math.max(1, Math.min(30, minuteStep));
    const arr: number[] = [];
    for (let i = 0; i < 60; i += step) arr.push(i);
    return arr;
  }, [minuteStep]);

  // === iOS Wheel 基本参数（固定行高/居中线） ===
  const ROW_H = 36;           // 每行高度
  const VISIBLE = 5;          // 显示 5 行（中间为选中）
  const VIEW_H = ROW_H * VISIBLE;

  const colHRef = useRef<HTMLDivElement | null>(null);
  const colMRef = useRef<HTMLDivElement | null>(null);

  // 打开时滚到当前值
  useEffect(() => {
    if (!open) return;
    colHRef.current?.scrollTo({ top: h * ROW_H });
    const mIdx = Math.max(0, minutes.indexOf(m));
    colMRef.current?.scrollTo({ top: mIdx * ROW_H });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // 惯性后自动吸附到最近项
  function snap(el: HTMLElement, total: number) {
    const idx = Math.round(el.scrollTop / ROW_H);
    const clamped = Math.max(0, Math.min(total - 1, idx));
    el.scrollTo({ top: clamped * ROW_H, behavior: 'smooth' });
    return clamped;
  }
  function onScrollH(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    window.clearTimeout((el as any)._t);
    (el as any)._t = window.setTimeout(() => setH(snap(el, 24)), 80);
  }
  function onScrollM(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    window.clearTimeout((el as any)._t);
    (el as any)._t = window.setTimeout(() => {
      const idx = snap(el, minutes.length);
      setM(minutes[idx] ?? 0);
    }, 80);
  }

  function confirm(nh = h, nm = m) {
    onChange(`${pad(nh)}:${pad(nm)}`);
    setOpen(false);
  }
  function clear() {
    onChange('');
    setH(12); setM(0);
    setOpen(false);
  }

  const display = value || placeholder;

  // 简洁弹层：白底 + 细边框；双列滚轮；中线选中
  const popup = (
    <div
      ref={popupRef}
      className="z-[9999] rounded-xl border border-[#f0d9a6] bg-white"
      style={{ width: rect?.width ?? 260, ...(attachToBody && rect ? { position: 'absolute' as const, top: rect.top, left: rect.left } : {}) }}
    >
      <div className="flex items-center justify-between px-3 py-2">
        <div className="text-sm text-neutral-700">
          已选 <span className="ml-1 font-semibold text-[#a83232]">{pad(h)}:{pad(m)}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={clear} className="rounded-lg border border-[#f0d9a6] bg-white px-2.5 py-1.5 text-xs text-neutral-700 hover:bg-[#fff7ed]">清空</button>
          <button onClick={() => confirm()} className="rounded-lg bg-[#a83232] px-3 py-1.5 text-xs font-medium text-[#fff7e8] hover:bg-[#8c2b2b]">完成</button>
        </div>
      </div>

      <div className="relative px-3 pb-3">
        {/* 中线选中框（绝对垂直居中） */}
        <div
          className="pointer-events-none absolute left-3 right-3 top-1/2 -translate-y-1/2 rounded-lg border border-[#f0d9a6] bg-transparent"
          style={{ height: ROW_H }}
        />
        <div className="grid grid-cols-2 gap-3">
          {/* 小时列 */}
          <div>
            <div className="mb-1 text-xs text-neutral-600">小时</div>
            <div
              ref={colHRef}
              onScroll={onScrollH}
              className="font-mono overflow-auto rounded-lg border border-[#f0d9a6] text-neutral-800"
              style={{ height: VIEW_H, scrollSnapType: 'y mandatory' as const }}
            >
              {/* 上下占位让中线正中 */}
              <div style={{ height: (VIEW_H - ROW_H) / 2 }} />
              {Array.from({ length: 24 }).map((_, i) => (
                <div
                  key={i}
                  style={{ height: ROW_H, lineHeight: `${ROW_H}px`, scrollSnapAlign: 'center' }}
                  className={`text-center text-sm ${i === h ? 'text-[#a83232] font-semibold' : ''}`}
                  onClick={() => { setH(i); confirm(i, m); }}
                >
                  {pad(i)}
                </div>
              ))}
              <div style={{ height: (VIEW_H - ROW_H) / 2 }} />
            </div>
          </div>
          {/* 分钟列 */}
          <div>
            <div className="mb-1 text-xs text-neutral-600">分钟</div>
            <div
              ref={colMRef}
              onScroll={onScrollM}
              className="font-mono overflow-auto rounded-lg border border-[#f0d9a6] text-neutral-800"
              style={{ height: VIEW_H, scrollSnapType: 'y mandatory' as const }}
            >
              <div style={{ height: (VIEW_H - ROW_H) / 2 }} />
              {minutes.map((mm) => (
                <div
                  key={mm}
                  style={{ height: ROW_H, lineHeight: `${ROW_H}px`, scrollSnapAlign: 'center' }}
                  className={`text-center text-sm ${mm === m ? 'text-[#a83232] font-semibold' : ''}`}
                  onClick={() => { setM(mm); confirm(h, mm); }}
                >
                  {pad(mm)}
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
      {/* 触发器：与日期输入同款样式 */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded-xl border border-[#f0d9a6] bg-[#fff7ed] px-3 py-2 text-left text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-red-400"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="选择时间"
      >
        {value || placeholder}
      </button>

      {/* 弹层：默认 portal 到 body，避免撑开布局/被裁切 */}
      {open && (attachToBody ? createPortal(popup, document.body) : <div className="absolute left-0 right-0 mt-2">{popup}</div>)}
    </div>
  );
}
