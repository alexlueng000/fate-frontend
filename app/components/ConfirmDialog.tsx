'use client';

import { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = '确认',
  cancelLabel = '取消',
  busy = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}
      className="w-[calc(100%_-_2rem)] max-w-md border-0 bg-transparent p-0 backdrop:bg-[rgba(42,37,34,0.55)] backdrop:backdrop-blur-sm"
    >
      <div className="relative border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 shadow-[var(--shadow-lg)] sm:p-7">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          aria-label="关闭弹窗"
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] disabled:opacity-40"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start gap-3 pr-9">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-serif text-xl font-medium text-[var(--color-text-primary)]">{title}</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[var(--color-text-secondary)]">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={busy} className="btn btn-ghost min-h-11">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} disabled={busy} className="btn btn-primary min-h-11">
            {busy ? '处理中…' : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
