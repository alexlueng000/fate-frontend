'use client';

import { useRouter } from 'next/navigation';
import { Button, Modal } from './ui';
interface QuotaExhaustedDialogProps {
  open: boolean; onClose: () => void; title: string; message: string;
  pricingHref?: string; onPricingClick?: () => void;
}
export default function QuotaExhaustedDialog({ open, onClose, title, message, pricingHref = '/pricing', onPricingClick }: QuotaExhaustedDialogProps) {
  const router = useRouter();
  const handleGoToPricing = () => { onPricingClick?.(); onClose(); router.push(pricingHref); };
  return <Modal open={open} onClose={onClose} title={title}>
    <p className="text-sm leading-7 text-[var(--color-text-secondary)]">{message}</p>
    <div className="mt-6 flex flex-wrap justify-end gap-3">
      <Button variant="ghost" onClick={onClose}>关闭</Button>
      <Button onClick={handleGoToPricing}>前往充值</Button>
    </div>
  </Modal>;
}
