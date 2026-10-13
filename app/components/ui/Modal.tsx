'use client';

import { forwardRef, useCallback, useEffect, useId, useRef, type DialogHTMLAttributes, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

// All dialogs share the same lock, including nested payment/error dialogs.
let locks = 0;
let originalOverflow = '';
function lockScroll() {
  if (locks++ === 0) {
    originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (--locks === 0) document.body.style.overflow = originalOverflow;
  };
}

/** Native dialog surface for callers that already manage showModal/close. */
export const DialogSurface = forwardRef<HTMLDialogElement, DialogHTMLAttributes<HTMLDialogElement>>(
  ({ className = '', children, ...props }, ref) => {
    const localRef = useRef<HTMLDialogElement | null>(null);
    const assignRef = useCallback((element: HTMLDialogElement | null) => {
      localRef.current = element;
      if (typeof ref === 'function') ref(element);
      else if (ref) ref.current = element;
    }, [ref]);
    useEffect(() => {
      const element = localRef.current;
      if (!element) return;
      let release: (() => void) | undefined;
      const sync = () => {
        if (element.open && !release) release = lockScroll();
        else if (!element.open && release) { release(); release = undefined; }
      };
      const observer = new MutationObserver(sync);
      observer.observe(element, { attributes: true, attributeFilter: ['open'] });
      sync();
      return () => { observer.disconnect(); release?.(); };
    }, []);
    return <dialog ref={assignRef} className={`ui-dialog ${className}`} {...props}>{children}</dialog>;
  }
);
DialogSurface.displayName = 'DialogSurface';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'wide';
  dismissible?: boolean;
  bare?: boolean;
  className?: string;
  'aria-labelledby'?: string;
}

export function Modal({ open, onClose, title, children, size = 'md', dismissible = true, bare = false, className = '', 'aria-labelledby': labelledBy }: ModalProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
    return () => { if (element.open) element.close(); };
  }, [open]);

  return <DialogSurface ref={dialog} className={`ui-modal ui-modal-${size} ${bare ? 'ui-modal-bare' : ''} ${className}`}
    aria-labelledby={labelledBy || (title ? titleId : undefined)} aria-label={!labelledBy && !title ? '操作弹窗' : undefined}
    onCancel={(event) => { event.preventDefault(); if (dismissible) onClose(); }}
    onClick={(event) => {
      if (!dismissible || event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
    }}>
    {title && !bare && <div className="ui-modal-header">
      <h2 id={titleId}>{title}</h2>
      {dismissible && <Button variant="icon" onClick={onClose} aria-label="关闭弹窗"><X size={20} aria-hidden /></Button>}
    </div>}
    {title && bare && !labelledBy && <h2 id={titleId} className="sr-only">{title}</h2>}
    {children}
  </DialogSurface>;
}
