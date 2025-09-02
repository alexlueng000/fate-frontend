'use client';

export function QuickActions({
  disabled,
  buttons,
  onClick,
}: {
  disabled: boolean;
  buttons: Array<{ label: string; prompt: string }>;
  onClick: (label: string, prompt: string) => void;
}) {
  return (
    <div className="rounded-3xl border border-red-200 bg-white/90 p-4 sm:p-6">
      <div className="mb-3 text-sm font-bold text-red-900">快捷分析</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {buttons.map((b) => (
          <button
            key={b.label}
            type="button"
            disabled={disabled}
            onClick={() => onClick(b.label, b.prompt)}
            className="h-12 sm:h-14 rounded-2xl border border-red-200 bg-white text-red-800 hover:bg-red-50 transition text-sm font-medium disabled:opacity-50"
            title={`快速生成：${b.label}`}
          >
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );
}
