export type DateTimeTheme = 'landing' | 'panel';

export const dateTimeThemes = {
  landing: {
    // 触发器样式
    trigger: 'bg-[var(--color-bg-deep)] border-2 border-transparent focus:border-[var(--color-primary)] focus:bg-white',
    triggerPadding: 'pl-12 pr-4 py-3.5',
    // 弹层样式
    popup: 'border-[var(--color-border)] bg-white',
    popupBorder: 'border-[var(--color-border)]',
    popupButton: 'bg-[var(--color-primary)] text-white hover:opacity-90',
    popupButtonSecondary: 'border-[var(--color-border)] bg-white text-neutral-700 hover:bg-neutral-50',
    // 选中高亮
    selectedText: 'text-[var(--color-primary)] font-semibold',
    // 图标
    iconColor: 'text-[var(--color-text-hint)]',
    iconSize: 'w-5 h-5',
  },
  panel: {
    trigger: 'bg-[#fff7ed] border border-[#f0d9a6] focus:ring-2 focus:ring-red-400',
    triggerPadding: 'pl-9 pr-9 py-2',
    popup: 'border-[#f0d9a6] bg-white',
    popupBorder: 'border-[#f0d9a6]',
    popupButton: 'bg-[#a83232] text-[#fff7e8] hover:bg-[#8c2b2b]',
    popupButtonSecondary: 'border-[#f0d9a6] bg-white text-neutral-700 hover:bg-[#fff7ed]',
    selectedText: 'text-[#a83232] font-semibold',
    iconColor: 'text-red-600/70',
    iconSize: 'w-4 h-4',
  },
};
