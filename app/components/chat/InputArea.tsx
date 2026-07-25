'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Send, RotateCcw, Square, Trash2 } from 'lucide-react';

type QuotaInfo = {
  remaining: number;
  is_unlimited: boolean;
};

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
  quota?: QuotaInfo | null;
  /** Render the regenerate button inside the input bar. Turn off when the parent surfaces it elsewhere (e.g. message actions). */
  showRegenerate?: boolean;
  /** Render the clear button inside the input bar. Turn off when the parent surfaces it elsewhere (e.g. header menu). */
  showClear?: boolean;
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
  quota,
  showRegenerate = true,
  showClear = true,
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
      if (!window.confirm(
        '确认清空当前对话内容？\n\n这会清除当前页面的聊天内容和 AI 对话上下文，但不会删除您的命盘档案或历史报告。',
      )) return;
    }
    onClear();
  };

  const compact = !showRegenerate && !showClear;

  if (compact) {
    return (
      <div className="px-1">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={ref}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full min-h-[72px] max-h-[160px] resize-none rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2.5 text-[15px] leading-relaxed text-[var(--color-text-primary)] placeholder:text-[var(--color-text-hint)] outline-none focus:border-[var(--color-primary)]/40 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/24 disabled:opacity-50 transition-colors"
              disabled={disabled}
              rows={1}
              aria-label="对话输入框"
            />
            {countInfo && (
              <div
                className={`absolute bottom-1.5 right-2 text-xs ${
                  countInfo.warn ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-hint)]'
                }`}
              >
                {countInfo.len}{typeof maxLength === 'number' ? ` / ${maxLength}` : ''}
              </div>
            )}
          </div>

          {!sending ? (
            <button
              onClick={onSend}
              disabled={!canSend || disabled}
              aria-label="发送"
              title="发送"
              className="flex-shrink-0 w-11 h-11 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/24"
            >
              <Send className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => onStop?.()}
              disabled={disabled}
              aria-label="停止"
              title="停止"
              className="flex-shrink-0 w-11 h-11 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] flex items-center justify-center hover:bg-[var(--color-bg-hover)] disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/24"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {(quota != null) && (
          <p className="mt-1.5 px-1 text-xs text-[var(--color-text-hint)] flex justify-end">
            <span className={!quota.is_unlimited && quota.remaining <= 3 ? 'text-[var(--color-primary)]' : ''}>
              {quota.is_unlimited ? '次数：内测免费' : `剩余：${quota.remaining}`}
            </span>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-2 sm:p-3">
      <div className="flex gap-2">
        {/* Input */}
        <div className="flex-1 relative">
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full min-h-[40px] max-h-[160px] resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-hint)] outline-none focus:border-[var(--color-gold-dark)] focus:ring-1 focus:ring-[var(--color-gold)]/20 disabled:opacity-50 transition-all"
            disabled={disabled}
            rows={1}
            aria-label="对话输入框"
          />
          {countInfo && (
            <div
              className={`absolute bottom-1.5 right-2 text-xs ${
                countInfo.warn ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-hint)]'
              }`}
            >
              {countInfo.len}{typeof maxLength === 'number' ? ` / ${maxLength}` : ''}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-1.5">
          {!sending ? (
            <button
              onClick={onSend}
              disabled={!canSend || disabled}
              className="h-[40px] px-4 rounded-lg bg-[var(--color-primary)] text-white font-medium flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-[var(--color-primary)]/20"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">发送</span>
            </button>
          ) : (
            <button
              onClick={() => onStop?.()}
              disabled={disabled}
              className="h-[40px] px-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] font-medium flex items-center gap-1.5 hover:bg-[var(--color-bg-hover)] disabled:opacity-50 transition-all"
            >
              <Square className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">停止</span>
            </button>
          )}

          <div className="flex gap-1.5">
            {showRegenerate && (
              <button
                onClick={onRegenerate}
                disabled={sending || disabled}
                className="flex-1 h-8 px-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] text-sm flex items-center justify-center hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-secondary)] disabled:opacity-50 transition-all"
                title="重新解读"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}

            {showClear && onClear && (
              <button
                onClick={handleClear}
                disabled={sending || disabled}
                className="flex-1 h-8 px-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] text-sm flex items-center justify-center hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-primary)] disabled:opacity-50 transition-all"
                title="清空对话"
              >
                <Trash2 className="w-3 h-3" />
                <span className="ml-1 whitespace-nowrap">清空对话</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <p className="mt-1.5 px-1 text-xs text-[var(--color-text-hint)] flex items-center justify-between">
        <span className="hidden sm:inline">Enter 发送 · Shift+Enter 换行</span>
        {quota != null && (
          <span className={`ml-auto ${!quota.is_unlimited && quota.remaining <= 3 ? 'text-[var(--color-primary)]' : ''}`}>
            {quota.is_unlimited ? '次数：内测免费' : `剩余：${quota.remaining}`}
          </span>
        )}
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
