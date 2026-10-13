'use client';

import { Button, Modal } from './ui';
export default function PaymentErrorDialog({ message, onClose }: { message: string; onClose: () => void }) {
  return <Modal open onClose={onClose} title="暂时无法发起支付">
    <p role="alert" className="whitespace-pre-wrap break-words text-sm leading-7 text-[var(--color-text-secondary)]">{message}</p>
    <Button onClick={onClose} className="mt-6 w-full">我知道了</Button>
  </Modal>;
}
