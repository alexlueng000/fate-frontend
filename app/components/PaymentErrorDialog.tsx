'use client';

import { useEffect, useId, useRef } from 'react';

export default function PaymentErrorDialog({ message, onClose }: { message: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const messageId = useId();

  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  return (
    <dialog ref={dialog} role="alertdialog" aria-labelledby={titleId} aria-describedby={messageId}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[400px] overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 text-[var(--color-text-primary)] shadow-2xl backdrop:bg-black/50">
      <h2 id={titleId} className="text-lg font-medium">暂时无法发起支付</h2>
      <p id={messageId} className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-[var(--color-text-secondary)]">{message}</p>
      <button type="button" onClick={onClose}
        className="mt-6 min-h-12 w-full rounded-xl bg-[var(--color-primary)] px-4 text-sm font-medium text-white">
        我知道了
      </button>
    </dialog>
  );
}
