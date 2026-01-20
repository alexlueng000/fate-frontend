// Design Tokens - 与 globals.css 保持同步 (小红书亮色主题)
export const colors = {
  primary: {
    DEFAULT: '#FF2442',
    light: '#FF4D6A',
    dark: '#E61D3D',
    glow: 'rgba(255, 36, 66, 0.15)',
  },
  gold: {
    DEFAULT: '#F5A623',
    light: '#FFB84D',
    dark: '#D4891A',
    glow: 'rgba(245, 166, 35, 0.15)',
  },
  tech: {
    DEFAULT: '#3B82F6',
    light: '#60A5FA',
    glow: 'rgba(59, 130, 246, 0.15)',
  },
  wuxing: {
    wood: '#10B981',
    fire: '#EF4444',
    earth: '#F59E0B',
    metal: '#6B7280',
    water: '#0EA5E9',
  },
  bg: {
    deep: '#F5F5F5',
    DEFAULT: '#FAFAFA',
    elevated: '#FFFFFF',
    card: '#FFFFFF',
    hover: '#F0F0F0',
  },
  text: {
    primary: '#1A1A1A',
    secondary: '#4A4A4A',
    muted: '#6B6B6B',
    hint: '#9CA3AF',
  },
  border: {
    DEFAULT: 'rgba(0, 0, 0, 0.08)',
    subtle: 'rgba(0, 0, 0, 0.04)',
    accent: 'rgba(255, 36, 66, 0.2)',
  },
} as const;

export const wuxingMap = {
  木: { color: colors.wuxing.wood, name: 'wood' },
  火: { color: colors.wuxing.fire, name: 'fire' },
  土: { color: colors.wuxing.earth, name: 'earth' },
  金: { color: colors.wuxing.metal, name: 'metal' },
  水: { color: colors.wuxing.water, name: 'water' },
} as const;

export const radius = {
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '20px',
  '2xl': '28px',
  full: '9999px',
} as const;

export type WuxingElement = keyof typeof wuxingMap;
