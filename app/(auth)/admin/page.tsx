'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Settings,
  MessageSquare,
  Zap,
  BookOpen,
  Ticket,
  ArrowLeft,
  Shield,
  BarChart3,
  MessageCircle,
  ThumbsDown,
  FileText,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

type Tone = 'primary' | 'gold' | 'mist';

interface MenuItem {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  tone: Tone;
}

interface MenuSection {
  title: string;
  description: string;
  items: MenuItem[];
}

const SECTIONS: MenuSection[] = [
  {
    title: '运营数据',
    description: '平台使用情况与用户反馈',
    items: [
      {
        href: '/admin/dashboard',
        icon: BarChart3,
        title: '数据概览',
        description: '用户、对话、消息统计',
        tone: 'mist',
      },
      {
        href: '/admin/ratings',
        icon: ThumbsDown,
        title: '消息评价',
        description: 'AI 回复的点赞与点踩',
        tone: 'primary',
      },
      {
        href: '/admin/feedbacks',
        icon: MessageCircle,
        title: '用户反馈',
        description: '查看和回复用户反馈',
        tone: 'mist',
      },
    ],
  },
  {
    title: '用户与安全',
    description: '准入控制与内容安全',
    items: [
      {
        href: '/admin/invitation-codes',
        icon: Ticket,
        title: '邀请码管理',
        description: '创建与管理注册邀请码',
        tone: 'gold',
      },
      {
        href: '/admin/sensitive-words',
        icon: Shield,
        title: '敏感词管理',
        description: 'AI 响应敏感词过滤规则',
        tone: 'primary',
      },
    ],
  },
  {
    title: 'AI 配置',
    description: '提示词、按钮与知识库',
    items: [
      {
        href: '/admin/config/system_prompt',
        icon: MessageSquare,
        title: '对话页提示词',
        description: '对话 AI 的系统提示词',
        tone: 'primary',
      },
      {
        href: '/admin/config/report_system_prompt',
        icon: FileText,
        title: '报告页提示词',
        description: '命理分析报告专用提示词',
        tone: 'primary',
      },
      {
        href: '/admin/config/liuyao_system_prompt',
        icon: Sparkles,
        title: '六爻提示词',
        description: '六爻解卦多轮对话提示词',
        tone: 'gold',
      },
      {
        href: '/admin/config/quick_buttons',
        icon: Zap,
        title: '快捷按钮',
        description: '用户界面快捷操作配置',
        tone: 'gold',
      },
      {
        href: '/admin/config/knowledge_base',
        icon: BookOpen,
        title: '知识库管理',
        description: 'RAG 知识库内容维护',
        tone: 'mist',
      },
    ],
  },
];

const TONE_STYLES: Record<Tone, { bg: string; icon: string }> = {
  primary: {
    bg: 'bg-[var(--color-primary)]/10',
    icon: 'text-[var(--color-primary)]',
  },
  gold: {
    bg: 'bg-[var(--color-gold)]/15',
    icon: 'text-[var(--color-gold-dark)]',
  },
  mist: {
    bg: 'bg-[var(--color-mist-light)]',
    icon: 'text-[var(--color-mist-deep)]',
  },
};

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<{ username?: string; is_admin?: boolean } | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('me');
      if (!raw) {
        router.push('/login?redirect=/admin');
        return;
      }
      const user = JSON.parse(raw);
      if (!user || !user.is_admin) {
        router.push('/login?redirect=/admin');
        return;
      }
      setMe(user);
    } catch {
      router.push('/login?redirect=/admin');
      return;
    } finally {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-gold)] border-t-transparent animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-20 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          返回账户
        </Link>

        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-gold)] flex items-center justify-center shadow-sm shrink-0">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1
              className="text-2xl font-bold text-[var(--color-text-primary)] leading-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              管理后台
            </h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
              欢迎，{me?.username}！管理系统配置和内容
            </p>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-9">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <div className="flex items-baseline gap-3 mb-3">
                <div className="w-1 h-4 rounded-full bg-[var(--color-primary)]" />
                <h2
                  className="text-base font-semibold text-[var(--color-text-primary)] tracking-wide"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {section.title}
                </h2>
                <span className="text-xs text-[var(--color-text-hint)]">
                  {section.description}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const tone = TONE_STYLES[item.tone];
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group card card-hover p-4 flex items-center gap-3.5"
                    >
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${tone.bg}`}
                      >
                        <Icon className={`w-5 h-5 ${tone.icon}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] leading-tight">
                          {item.title}
                        </h3>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1 leading-snug line-clamp-1">
                          {item.description}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-xs text-[var(--color-text-hint)]">
            易凡文化 · 管理控制台
          </p>
        </div>
      </div>
    </main>
  );
}
