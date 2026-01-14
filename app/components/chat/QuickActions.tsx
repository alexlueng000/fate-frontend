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
    <div className="rounded-3xl border border-[rgba(142,129,116,0.15)] bg-[#fffbf7] p-4 sm:p-6">
      <div className="mb-3 text-sm font-bold text-[#c93b3a]">快捷分析</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {buttons.map((b) => (
          <button
            key={b.label}
            type="button"
            disabled={disabled}
            onClick={() => onClick(b.label, b.prompt)}
            className="h-12 sm:h-14 rounded-2xl border border-[rgba(142,129,116,0.15)] bg-white text-[#c93b3a] hover:bg-[#fbf7f2] transition text-sm font-medium disabled:opacity-50"
            title={`快速生成：${b.label}`}
          >
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );
}
