import { BookOpen, Crown, Dices, FileText, GraduationCap, History, LayoutDashboard, MessageSquare } from 'lucide-react';
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
  { href: '/xinji', Icon: BookOpen, shortLabel: '心镜', longLabel: '心镜灯' },
  { href: '/liuyao', Icon: Dices, shortLabel: '六爻', longLabel: '六爻玄机' },
  { href: '/videos', Icon: GraduationCap, shortLabel: '课程', longLabel: '视频学习' },
];

export const SECONDARY_NAV: NavItem[] = [
  { href: '/membership', Icon: Crown, shortLabel: '会员', longLabel: '会员中心' },
  { href: '/report', Icon: FileText, shortLabel: '报告', longLabel: '命理报告' },
  { href: '/history', Icon: History, shortLabel: '记录', longLabel: '解读记录' },
];

export const BOTTOM_NAV: NavItem[] = [
  { href: '/dashboard', Icon: LayoutDashboard, shortLabel: '首页', longLabel: '命理首页' },
  { href: '/panel', Icon: MessageSquare, shortLabel: '八字', longLabel: '八字对话' },
  { href: '/liuyao', Icon: Dices, shortLabel: '六爻', longLabel: '六爻玄机' },
  { href: '/membership', Icon: Crown, shortLabel: '会员', longLabel: '会员中心' },
];

export const MORE_NAV: NavItem[] = [
  { href: '/report', Icon: FileText, shortLabel: '报告', longLabel: '命理报告' },
  { href: '/xinji', Icon: BookOpen, shortLabel: '心镜', longLabel: '心镜灯' },
  { href: '/videos', Icon: GraduationCap, shortLabel: '课程', longLabel: '视频学习' },
  { href: '/history', Icon: History, shortLabel: '记录', longLabel: '解读记录' },
];
