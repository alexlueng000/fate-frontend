/**
 * 主题常量
 * 与微信小程序配色完全一致
 */

export const theme = {
  colors: {
    // 主红色系
    primary: '#c93b3a',
    primaryLight: '#e45c5c',
    primaryDark: '#a82820',

    // 背景色系
    bg: '#f7f3ed',
    bgWarm: '#fbf7f2',
    cardBg: '#fffbf7',

    // 文字色系
    textDark: '#1a1816',
    textMedium: '#3a332d',
    textLight: '#8e8174',
    textHint: '#b8a89a',

    // 边框与装饰
    borderLight: 'rgba(142, 129, 116, 0.15)',
    gold: '#C4A574',
    goldDark: '#A67C52',

    // 语义色
    success: '#4a9c6d',
    warning: '#d4a556',
    error: '#c93b3a',
  },

  gradients: {
    bg: 'linear-gradient(180deg, #f7f3ed 0%, #f5ede1 100%)',
    primary: 'linear-gradient(135deg, #c93b3a 0%, #e45c5c 100%)',
    card: 'linear-gradient(135deg, #fff 0%, #fffbf7 100%)',
    aiBubble: 'linear-gradient(135deg, #fff 0%, #fff9f5 100%)',
    userBubble: 'linear-gradient(135deg, #c93b3a 0%, #e45c5c 100%)',
  },

  shadows: {
    card: '0 16px 48px rgba(26, 24, 22, 0.06), 0 0 0 1px rgba(255, 255, 255, 0.5) inset',
    button: '0 12px 32px rgba(201, 59, 58, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
    subtle: '0 4px 20px rgba(184, 50, 39, 0.06), 0 0 0 1px rgba(184, 50, 39, 0.03)',
  },

  radius: {
    sm: '8px',   // 小圆角 ~14rpx
    md: '12px',  // 中圆角 ~20rpx
    lg: '16px',  // 大圆角 ~24rpx
    xl: '20px',  // 超大圆角 ~28rpx
    full: '9999px',
  },
} as const;

/**
 * Tailwind 类名助手
 */
export const cn = {
  // 背景类
  bgGradient: 'bg-gradient-to-b from-[#f7f3ed] to-[#f5ede1]',

  // 按钮类
  btnPrimary: 'bg-gradient-to-r from-[#c93b3a] to-[#e45c5c] text-white rounded-xl shadow-[0_12px_32px_rgba(201,59,58,0.35),0_0_0_1px_rgba(255,255,255,0.1)_inset] hover:shadow-[0_16px_40px_rgba(201,59,58,0.4)] hover:-translate-y-px active:scale-[0.98] transition-all duration-300',
  btnGhost: 'border border-[#c93b3a] text-[#c93b3a] bg-white/70 hover:bg-[#fdeecf] active:scale-[0.98] transition-all',

  // 卡片类
  card: 'bg-[#fffbf7] rounded-2xl shadow-[0_16px_48px_rgba(26,24,22,0.06),0_0_0_1px_rgba(255,255,255,0.5)_inset]',

  // 文字类
  textDark: 'text-[#1a1816]',
  textMedium: 'text-[#3a332d]',
  textLight: 'text-[#8e8174]',
  textHint: 'text-[#b8a89a]',
  textPrimary: 'text-[#c93b3a]',
} as const;
