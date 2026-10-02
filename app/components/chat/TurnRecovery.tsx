'use client';

export function TurnRecovery({ error, notice, hasDraft, busy, recover }: {
  error: string | null; notice: string | null; hasDraft: boolean; busy: boolean; recover: () => Promise<void>;
}) {
  return <>
    {error && <div role="alert" className="rounded-[24px] border border-[var(--color-primary)]/25 bg-[var(--color-bg-card)] p-5 text-sm text-[var(--color-text-secondary)]">
      <p className="font-medium text-[var(--color-text-primary)]">回复保存状态需要确认</p>
      <p className="mt-2 leading-7">{error}</p>
      <p className="mt-2 text-xs leading-6">成功保存的回复才计次。网络中断时，先检查保存结果再继续。</p>
      {hasDraft && <button type="button" className="btn btn-secondary mt-3" disabled={busy} onClick={() => void recover()}>
        {busy ? '正在重新加载…' : '重新加载对话'}</button>}
    </div>}
    {notice && <p role="status" className="text-sm leading-6 text-[var(--color-text-secondary)]">{notice}</p>}
  </>;
}
