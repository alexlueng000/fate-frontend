import { Crown, Dices, FileText, History, LayoutDashboard, MessageSquare, MessageSquareText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type NavItem = {
  href: string;
  Icon: LucideIcon;
  shortLabel: string;
  longLabel: string;
};

export const PRIMARY_NAV: NavItem[] = [
  { href: '/dashboard', Icon: LayoutDashboard, shortLabel: '首页', longLabel: '命理首页' },
  { href: '/panel', Icon: MessageSquare, shortLabel: '八字', longLabel: '八字对话' },
  { href: '/liuyao', Icon: Dices, shortLabel: '六爻', longLabel: '六爻玄机' },
];

export const SECONDARY_NAV: NavItem[] = [
  { href: '/feedback', Icon: MessageSquareText, shortLabel: '反馈', longLabel: '意见反馈' },
  { href: '/membership', Icon: Crown, shortLabel: '套餐', longLabel: '套餐与额度' },
  { href: '/report', Icon: FileText, shortLabel: '报告', longLabel: '命理报告' },
  { href: '/history', Icon: History, shortLabel: '记录', longLabel: '解读记录' },
];

export const BOTTOM_NAV: NavItem[] = [
  { href: '/dashboard', Icon: LayoutDashboard, shortLabel: '首页', longLabel: '命理首页' },
  { href: '/panel', Icon: MessageSquare, shortLabel: '八字', longLabel: '八字对话' },
  { href: '/liuyao', Icon: Dices, shortLabel: '六爻', longLabel: '六爻玄机' },
  { href: '/membership', Icon: Crown, shortLabel: '套餐', longLabel: '套餐与额度' },
];

export const MORE_NAV: NavItem[] = [
  { href: '/feedback', Icon: MessageSquareText, shortLabel: '反馈', longLabel: '意见反馈' },
  { href: '/report', Icon: FileText, shortLabel: '报告', longLabel: '命理报告' },
  { href: '/history', Icon: History, shortLabel: '记录', longLabel: '解读记录' },
];
