'use client';

export function ChatHeader({
  conversationId,
  onBack,
}: {
  conversationId: string | null;
  onBack: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-xl font-semibold text-red-900">对话解读</h1>
      <div className="flex items-center gap-2 text-xs text-neutral-700">
        {conversationId ? (
          <span className="px-2 py-1 rounded bg-white/70 border border-red-200">ID: {conversationId}</span>
        ) : (
          <span>正在建立会话…</span>
        )}
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-red-200 bg-white/90 px-3 py-1 text-red-800 hover:bg-red-50 transition"
        >
          返回首页
        </button>
      </div>
    </div>
  );
}
