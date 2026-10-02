'use client';

import * as Accordion from '@radix-ui/react-accordion';
import * as Dialog from '@radix-ui/react-dialog';
import { ChevronDown, X } from 'lucide-react';
import type { ReactNode } from 'react';

/** Radix semantics with the project's warm, restrained theme. */
export function EvidencePanel({ title, children }: { title: string; children: ReactNode }) {
  return <Accordion.Root type="single" collapsible className="consult-evidence">
    <Accordion.Item value="evidence">
      <Accordion.Header><Accordion.Trigger className="consult-evidence-trigger">
        {title}<ChevronDown size={16} aria-hidden />
      </Accordion.Trigger></Accordion.Header>
      <Accordion.Content className="consult-evidence-content"><div>{children}</div></Accordion.Content>
    </Accordion.Item>
  </Accordion.Root>;
}

export function ContextDrawer({ title, description, trigger, children }: {
  title: string; description: string; trigger: ReactNode; children: ReactNode;
}) {
  return <Dialog.Root>
    <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="consult-drawer-overlay" />
      <Dialog.Content className="consult-drawer">
        <div className="flex items-center justify-between gap-4">
          <Dialog.Title className="font-serif text-xl">{title}</Dialog.Title>
          <Dialog.Close className="consult-icon-button" aria-label="关闭面板"><X size={20} /></Dialog.Close>
        </div>
        <Dialog.Description className="mt-2 text-sm text-[var(--color-text-secondary)]">{description}</Dialog.Description>
        <div className="mt-6">{children}</div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}

export function EmptyReading({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return <section className="consult-empty">
    <p className="consult-eyebrow">从一个具体的问题开始</p>
    <h2 className="font-serif text-2xl">{title}</h2>
    <p className="mt-4 leading-7 text-[var(--color-text-secondary)]">{description}</p>
    {children && <div className="mt-6">{children}</div>}
  </section>;
}
