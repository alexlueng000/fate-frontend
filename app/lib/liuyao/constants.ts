// 六爻快捷分析按钮：prompt 字段被复用为 quickChat 的 kind sentinel。
// 复用 components/chat/QuickActions 的 onClick(label, prompt) 协议，由 page 层将 prompt 转发到 quickChat。
export const LIUYAO_QUICK_KINDS = ['character', 'timing'] as const;
export type LiuyaoQuickKind = (typeof LIUYAO_QUICK_KINDS)[number];

export const LIUYAO_QUICK_BUTTONS: Array<{ label: string; prompt: LiuyaoQuickKind }> = [
  { label: '人物画像', prompt: 'character' },
  { label: '应期', prompt: 'timing' },
];

// 用于 localStorage 存储每个卦象对应的 conversation_id
export const LIUYAO_ACTIVE_CONV_KEY = (hexagramId: string) =>
  `liuyao:active_conv:${hexagramId}`;
