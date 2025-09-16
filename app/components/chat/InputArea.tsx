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

  /** 新增（可选） */
  onStop?: () => void;                    // 生成中点击“停止”
  placeholder?: string;                   // 占位符
  autoFocus?: boolean;                    // 自动聚焦
  allowEnterToSend?: boolean;             // 是否 Enter 发送（默认 true）
  maxRows?: number;                       // 自动扩展的最大行数（默认 8）
  suggestions?: string[];                 // 快捷短语 chips
  maxLength?: number;                     // 字符上限（仅提示，不强制截断）
};

export function InputArea({
  value, onChange, onKeyDown,
  canSend, sending, disabled,
  onSend, onRegenerate,

  // 新增可选项（都有默认）
  onStop,
  placeholder = '请输入你的问题，Shift+Enter 换行；Ctrl/Cmd+Enter 发送…',
  autoFocus = false,
  allowEnterToSend = true,
  maxRows = 8,
  suggestions = [],
  maxLength,
}: InputAreaProps) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  // 自动高度
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // 将高度重置为 auto，再根据 scrollHeight 设定
    el.style.height = 'auto';
    const lineHeight = getLineHeight(el);
    const max = maxRows * lineHeight;
    const next = Math.min(el.scrollHeight, max);
    el.style.height = `${next}px`;
  }, [value, maxRows]);

  // 自动聚焦
  useEffect(() => {
    if (autoFocus) {
      ref.current?.focus();
    }
  }, [autoFocus]);

  // 键盘处理：Enter 发送 / Shift+Enter 换行 / Cmd/Ctrl+Enter 发送 / Esc 失焦
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (onKeyDown) onKeyDown(e);

    if (e.defaultPrevented) return;
    const isMac = navigator.platform.toLowerCase().includes('mac');
    const isCmdEnter = (isMac && e.metaKey && e.key === 'Enter') || (!isMac && e.ctrlKey && e.key === 'Enter');

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

    if (e.key === 'Escape') {
      (e.target as HTMLTextAreaElement).blur();
    }
  }

  // 计数提示
  const countInfo = useMemo(() => {
    if (typeof maxLength !== 'number') return null;
    const len = value.length;
    const warn = len > maxLength;
    return { len, warn };
  }, [value, maxLength]);

  // 品牌色
  const primary = '#a83232';
  const primaryHover = '#8c2b2b';

  return (
    <div className="flex flex-col gap-2">
      {/* 快捷短语 chips（可选） */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s, i) => (
            <button
              key={`${s}-${i}`}
              type="button"
              onClick={() => onChange(value ? (value.trimEnd() + (value.endsWith('\n') ? '' : '\n') + s) : s)}
              className="rounded-xl border border-red-200 bg-white px-3 py-1 text-xs text-red-800 hover:bg-red-50"
              title="点击将短语加入输入框"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="min-h-[3.25rem] max-h-[40svh] w-full resize-none rounded-2xl border border-red-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-red-500/30 disabled:opacity-50"
            disabled={disabled}
            rows={3}
            aria-label="对话输入框"
          />
          {/* 字数提示 */}
          {countInfo && (
            <div className={`pointer-events-none absolute bottom-1 right-2 text-[11px] ${countInfo.warn ? 'text-red-600' : 'text-neutral-400'}`}>
              {countInfo.len}{typeof maxLength === 'number' ? ` / ${maxLength}` : ''}
            </div>
          )}
          {/* 快捷键提示（小而不打扰） */}
          <div className="mt-1 text-[11px] text-neutral-500">
            回车发送（Shift+Enter 换行，Ctrl/Cmd+Enter 发送）
          </div>
        </div>

        <div className="flex gap-2">
          {/* 主按钮：发送 / 停止 */}
          {!sending ? (
            <button
              onClick={onSend}
              disabled={!canSend || disabled}
              className="h-12 sm:h-14 w-28 rounded-2xl bg-[#a83232] text-sm font-semibold text-[#fff7e8] hover:bg-[#8c2b2b] disabled:opacity-50 shadow-lg shadow-red-600/20 transition"
              title={disabled ? '正在建立会话，请稍候…' : '发送消息（Enter）'}
              aria-label="发送消息"
              style={{ backgroundColor: primary }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = primaryHover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = primary)}
            >
              发送
            </button>
          ) : (
            <button
              onClick={() => onStop?.()}
              disabled={disabled}
              className="h-12 sm:h-14 w-28 rounded-2xl border border-red-300 bg-white text-sm font-semibold text-red-800 hover:bg-red-50 disabled:opacity-50 transition"
              title="停止生成"
              aria-label="停止生成"
            >
              停止
            </button>
          )}

          {/* 次按钮：重新解读 */}
          <button
            onClick={onRegenerate}
            disabled={sending || disabled}
            className="h-12 sm:h-14 w-28 rounded-2xl border border-red-200 bg-white text-sm font-semibold text-red-800 hover:bg-red-50 disabled:opacity-50 transition"
            title="重新生成上一条解读"
            aria-label="重新生成上一条解读"
          >
            重新解读
          </button>
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
    // Fallback：大致估算
    const fontSize = parseFloat(computed.fontSize || '14');
    return Math.round(fontSize * 1.4);
  }
  return Math.round(parseFloat(lh));
}
