// 六爻快捷分析按钮：默认值仅用于管理后台配置加载失败时的兜底。
// 正常情况下从 /admin/config?key=liuyao_quick_buttons 拉取动态配置。
export const LIUYAO_QUICK_BUTTONS: Array<{ label: string; prompt: string }> = [
  {
    label: '人物画像分析',
    prompt: '请基于当前卦象，专门分析与此问相关的人物画像（外貌、气质、性格、行为），从世应、用神、动爻、六亲、六兽、五行多角度交叉印证，写出画面感。',
  },
  {
    label: '应期分析',
    prompt: '请基于当前卦象，专门分析应期（事情发生或落定的时间节点），覆盖短期（日时）、中期（月节气）、长期（年），并说明取象逻辑。',
  },
];

// 用于 localStorage 存储每个卦象对应的 conversation_id
export const LIUYAO_ACTIVE_CONV_KEY = (hexagramId: string) =>
  `liuyao:active_conv:${hexagramId}`;
