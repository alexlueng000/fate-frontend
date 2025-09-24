'use client';

import { useEffect, useMemo, useRef } from 'react';

type InputAreaProps = {
  value: string;
  onChange: (v: string) => void;
  onKeyDown?: (ev: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  canSend: boolean;
  sending: boolean;
  disabled: boolean;
  onSend: () => void;
  onRegenerate: () => void;

  /** 可选 */
  onStop?: () => void;
  onClear?: () => void;
  confirmClear?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  allowEnterToSend?: boolean;
  maxRows?: number;
  suggestions?: string[];
  maxLength?: number;
};

export function InputArea({
  value, onChange, onKeyDown,
  canSend, sending, disabled,
  onSend, onRegenerate,

  onStop,
  onClear,
  confirmClear = false,
  placeholder = '请输入你的问题，Shift+Enter 换行；Ctrl/Cmd+Enter 发送…',
  autoFocus = false,
  allowEnterToSend = true,
  maxRows = 8,
  suggestions = [],
  maxLength,
}: InputAreaProps) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  // 品牌色（集中管理）
  const color = {
    primary: '#a83232',
    primaryHover: '#8c2b2b',
    surface: '#fff7e8',
    border: '#f0d9a6',
  };

  // 自动高度
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    const lineHeight = getLineHeight(el);
    const next = Math.min(el.scrollHeight, maxRows * lineHeight);
    el.style.height = `${next}px`;
  }, [value, maxRows]);

  // 自动聚焦
  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  // 键盘：Enter 发送 / Shift+Enter 换行 / Cmd/Ctrl+Enter 发送 / Esc 失焦
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;

    const isMac = navigator.platform.toLowerCase().includes('mac');
    const isCmdEnter =
      (isMac && e.metaKey && e.key === 'Enter') ||
      (!isMac && e.ctrlKey && e.key === 'Enter');

    if (isCmdEnter) {
      e.preventDefault();
      if (!sending && !disabled && canSend) onSend();
      return;
    }
    if (allowEnterToSend && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sending && !disabled && canSend) onSend();
      return;
    }
    if (e.key === 'Escape') (e.target as HTMLTextAreaElement).blur();
  }

  // 字数提示
  const countInfo = useMemo(() => {
    if (typeof maxLength !== 'number') return null;
    const len = value.length;
    return { len, warn: len > maxLength };
  }, [value, maxLength]);

  // 统一触发清空
  const handleClear = () => {
    if (!onClear) return;
    if (confirmClear) {
      if (!window.confirm('确认清空当前对话内容？此操作不可恢复。')) return;
    }
    onClear();
  };

  return (
    <div className="flex flex-col gap-3">
      {/* 快捷短语 chips（可选） */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s, i) => (
            <button
              key={`${s}-${i}`}
              type="button"
              onClick={() =>
                onChange(value ? value.trimEnd() + (value.endsWith('\n') ? '' : '\n') + s : s)
              }
              className="rounded-xl border border-red-200 bg-white px-3 py-1 text-xs text-red-800 hover:bg-red-50 transition shadow-sm"
              title="点击将短语加入输入框"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* 外层容器：柔和卡片 */}
      <div className="rounded-2xl border border-[#f5e6c7] bg-white/80 shadow-sm ring-1 ring-black/0 p-3 sm:p-4">
        {/* 输入区 + 操作按钮 */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          {/* 输入框：带内阴影与聚焦环 */}
          <div className="relative flex-1">
            <textarea
              ref={ref}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="min-h-[3.25rem] max-h-[40svh] w-full resize-none rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none shadow-inner focus:border-transparent focus:ring-4 focus:ring-red-500/20 disabled:opacity-50"
              disabled={disabled}
              rows={3}
              aria-label="对话输入框"
            />

            {/* 字数提示徽标 */}
            {countInfo && (
              <div
                className={`pointer-events-none absolute -bottom-2 right-2 translate-y-full rounded-full px-2 py-0.5 text-[11px] shadow-sm ${
                  countInfo.warn ? 'bg-red-100 text-red-700' : 'bg-neutral-100 text-neutral-500'
                }`}
              >
                {countInfo.len}{typeof maxLength === 'number' ? ` / ${maxLength}` : ''}
              </div>
            )}

            {/* 快捷键提示（小而不打扰） */}
            <div className="mt-2 text-[11px] text-neutral-500">
              回车发送（Shift+Enter 换行，Ctrl/Cmd+Enter 发送）
            </div>
          </div>

          {/* 按钮区（响应式）：小屏整列；≥sm 固定宽度竖排，三按钮等宽 */}
          <div className="sm:w-44">
            <div className="flex flex-col gap-2">
              {/* 上排：两列等宽 */}
              <div className="grid grid-cols-2 gap-2">
                {!sending ? (
                  <button
                    onClick={onSend}
                    disabled={!canSend || disabled}
                    className="h-12 w-full rounded-xl text-sm font-semibold text-[#fff7e8] transition shadow-sm"
                    style={{ backgroundColor: color.primary }}
                  >
                    发送
                  </button>
                ) : (
                  <button
                    onClick={() => onStop?.()}
                    disabled={disabled}
                    className="h-12 w-full rounded-xl border text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50 transition shadow-sm"
                    style={{ borderColor: '#f3b6b6', backgroundColor: '#fff' }}
                  >
                    停止
                  </button>
                )}

                <button
                  onClick={onRegenerate}
                  disabled={sending || disabled}
                  className="h-12 w-full rounded-xl border text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition shadow-sm"
                  style={{ borderColor: color.border, color: color.primary, backgroundColor: '#fff' }}
                >
                  重新解读
                </button>
              </div>

              {/* 下排：清空对话 → 宽度跟上排保持一致 */}
              {onClear && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleClear}
                    disabled={sending || disabled}
                    className="h-12 col-span-1 w-full rounded-xl border text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition shadow-sm"
                    style={{ borderColor: color.border, color: color.primary, backgroundColor: '#fff' }}
                  >
                    清空对话
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 读取 textarea 的行高（用于计算最大高度） */
function getLineHeight(el: HTMLTextAreaElement): number {
  const computed = window.getComputedStyle(el);
  const lh = computed.lineHeight;
  if (lh === 'normal') {
    const fontSize = parseFloat(computed.fontSize || '14');
    return Math.round(fontSize * 1.4);
  }
  return Math.round(parseFloat(lh));
}
