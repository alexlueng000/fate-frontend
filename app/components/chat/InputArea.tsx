'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Send, RotateCcw, Square, Trash2 } from 'lucide-react';

type InputAreaProps = {
  value: string;
  onChange: (v: string) => void;
  onKeyDown?: (ev: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  canSend: boolean;
  sending: boolean;
  disabled: boolean;
  onSend: () => void;
  onRegenerate: () => void;
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
  placeholder = '请输入你的问题，Enter 发送，Shift+Enter 换行…',
  autoFocus = false,
  allowEnterToSend = true,
  maxRows = 6,
  maxLength,
}: InputAreaProps) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    const lineHeight = getLineHeight(el);
    const next = Math.min(el.scrollHeight, maxRows * lineHeight);
    el.style.height = `${next}px`;
  }, [value, maxRows]);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

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

  const countInfo = useMemo(() => {
    if (typeof maxLength !== 'number') return null;
    const len = value.length;
    return { len, warn: len > maxLength };
  }, [value, maxLength]);

  const handleClear = () => {
    if (!onClear) return;
    if (confirmClear) {
      if (!window.confirm('确认清空当前对话内容？此操作不可恢复。')) return;
    }
    onClear();
  };

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
      <div className="flex gap-3">
        {/* Input */}
        <div className="flex-1 relative">
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full min-h-[52px] max-h-[200px] resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-hint)] outline-none focus:border-[var(--color-gold-dark)] focus:ring-2 focus:ring-[var(--color-gold)]/20 disabled:opacity-50 transition-all"
            disabled={disabled}
            rows={2}
            aria-label="对话输入框"
          />
          {countInfo && (
            <div
              className={`absolute bottom-2 right-3 text-xs ${
                countInfo.warn ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-hint)]'
              }`}
            >
              {countInfo.len}{typeof maxLength === 'number' ? ` / ${maxLength}` : ''}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2">
          {!sending ? (
            <button
              onClick={onSend}
              disabled={!canSend || disabled}
              className="h-[52px] px-5 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white font-medium flex items-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[var(--color-primary)]/20"
            >
              <Send className="w-4 h-4" />
              发送
            </button>
          ) : (
            <button
              onClick={() => onStop?.()}
              disabled={disabled}
              className="h-[52px] px-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] font-medium flex items-center gap-2 hover:bg-[var(--color-bg-hover)] disabled:opacity-50 transition-all"
            >
              <Square className="w-4 h-4" />
              停止
            </button>
          )}

          <div className="flex gap-2">
            <button
              onClick={onRegenerate}
              disabled={sending || disabled}
              className="flex-1 h-10 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] text-sm flex items-center justify-center gap-1.5 hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-secondary)] disabled:opacity-50 transition-all"
              title="重新解读"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {onClear && (
              <button
                onClick={handleClear}
                disabled={sending || disabled}
                className="flex-1 h-10 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] text-sm flex items-center justify-center gap-1.5 hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-primary)] disabled:opacity-50 transition-all"
                title="清空对话"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <p className="mt-2 text-xs text-[var(--color-text-hint)]">
        Enter 发送 · Shift+Enter 换行
      </p>
    </div>
  );
}

function getLineHeight(el: HTMLTextAreaElement): number {
  const computed = window.getComputedStyle(el);
  const lh = computed.lineHeight;
  if (lh === 'normal') {
    const fontSize = parseFloat(computed.fontSize || '14');
    return Math.round(fontSize * 1.4);
  }
  return Math.round(parseFloat(lh));
}
