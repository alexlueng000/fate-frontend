'use client';

import { AlertTriangle } from 'lucide-react';
import { Button, Modal } from './ui';

type ConfirmDialogProps = {
  open: boolean; title: string; message: string;
  confirmLabel?: string; cancelLabel?: string; busy?: boolean;
  onConfirm: () => void; onClose: () => void;
};
export default function ConfirmDialog({ open, title, message, confirmLabel = '确认', cancelLabel = '取消', busy = false, onConfirm, onClose }: ConfirmDialogProps) {
  return <Modal open={open} onClose={onClose} title={title} dismissible={!busy}>
    <div className="flex items-start gap-3">
      <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-[var(--color-primary)]" aria-hidden />
      <p className="whitespace-pre-line text-sm leading-6 text-[var(--color-text-secondary)]">{message}</p>
    </div>
    <div className="mt-6 flex justify-end gap-3">
      <Button variant="ghost" onClick={onClose} disabled={busy} autoFocus>{cancelLabel}</Button>
      <Button variant="danger" onClick={onConfirm} loading={busy}>{busy ? '处理中…' : confirmLabel}</Button>
    </div>
  </Modal>;
}
