'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

interface QuotaExhaustedDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

export default function QuotaExhaustedDialog({
  open,
  onClose,
  title,
  message,
}: QuotaExhaustedDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  const handleClose = () => {
    onClose();
  };

  const handleGoToPricing = () => {
    onClose();
    router.push('/pricing');
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      handleClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="quota-exhausted-dialog"
      onCancel={handleClose}
    >
      <div className="dialog-content">
        <button
          onClick={handleClose}
          className="close-btn"
          aria-label="关闭"
        >
          <X size={20} />
        </button>

        <div className="dialog-body">
          <h2 className="dialog-title">{title}</h2>
          <p className="dialog-message">{message}</p>
        </div>

        <div className="dialog-actions">
          <button onClick={handleClose} className="btn btn-ghost">
            关闭
          </button>
          <button onClick={handleGoToPricing} className="btn btn-primary">
            前往充值
          </button>
        </div>
      </div>

      <style jsx>{`
        .quota-exhausted-dialog {
          border: none;
          border-radius: var(--radius-lg);
          padding: 0;
          max-width: 420px;
          width: calc(100vw - 2rem);
          background: var(--color-bg-card);
          box-shadow: var(--shadow-lg);
          animation: scaleIn 300ms var(--ease-out) both;
        }

        .quota-exhausted-dialog::backdrop {
          background: rgba(42, 37, 34, 0.6);
          backdrop-filter: blur(4px);
          animation: fadeIn 300ms var(--ease-out) both;
        }

        .dialog-content {
          position: relative;
          padding: 2rem;
        }

        .close-btn {
          position: absolute;
          top: 1rem;
          right: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          color: var(--color-text-muted);
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: background var(--duration-fast) var(--ease-out),
                      color var(--duration-fast) var(--ease-out);
        }

        .close-btn:hover {
          background: var(--color-bg-hover);
          color: var(--color-text-primary);
        }

        .close-btn:focus-visible {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
        }

        .dialog-body {
          margin-bottom: 1.5rem;
        }

        .dialog-title {
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--color-text-primary);
          margin: 0 0 0.75rem 0;
        }

        .dialog-message {
          font-size: 0.9375rem;
          color: var(--color-text-secondary);
          line-height: 1.6;
          margin: 0;
        }

        .dialog-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @media (max-width: 640px) {
          .dialog-content {
            padding: 1.5rem;
          }

          .dialog-actions {
            flex-direction: column-reverse;
          }

          .dialog-actions .btn {
            width: 100%;
          }
        }
      `}</style>
    </dialog>
  );
}
