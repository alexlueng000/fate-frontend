'use client';

export function InputArea({
  value, onChange, onKeyDown,
  canSend, sending, disabled,
  onSend, onRegenerate,
}: {
  value: string;
  onChange: (v: string) => void;
  onKeyDown: (ev: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  canSend: boolean;
  sending: boolean;
  disabled: boolean;
  onSend: () => void;
  onRegenerate: () => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="请输入你的问题，Shift+Enter 换行…"
        className="h-24 flex-1 resize-none rounded-2xl border border-red-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-red-500/30 disabled:opacity-50"
        disabled={disabled}
      />

      <div className="flex gap-2">
        <button
          onClick={onSend}
          disabled={!canSend}
          className="h-24 w-28 rounded-2xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 shadow-lg shadow-red-600/20"
          title={disabled ? '正在建立会话，请稍候…' : undefined}
        >
          {sending ? '发送中…' : '发送'}
        </button>

        <button
          onClick={onRegenerate}
          disabled={sending || disabled}
          className="h-24 w-28 rounded-2xl border border-red-200 bg-white text-sm font-semibold text-red-800 hover:bg-red-50 disabled:opacity-50"
          title="重新生成上一条解读"
        >
          重新解读
        </button>
      </div>
    </div>
  );
}
