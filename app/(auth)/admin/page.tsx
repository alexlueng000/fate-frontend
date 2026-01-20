'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Settings, MessageSquare, Zap, BookOpen, ChevronRight, ArrowLeft } from 'lucide-react';

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

  const menuItems = [
    {
      href: '/admin/config/system_prompt',
      icon: <MessageSquare className="w-6 h-6" />,
      title: '系统提示词',
      description: '编辑 AI 解读的系统提示词配置',
      color: 'var(--color-primary)',
    },
    {
      href: '/admin/config/quick_buttons',
      icon: <Zap className="w-6 h-6" />,
      title: '快捷按钮',
      description: '管理用户界面的快捷操作按钮',
      color: 'var(--color-gold)',
    },
    {
      href: '/admin/config/knowledge_base',
      icon: <BookOpen className="w-6 h-6" />,
      title: '知识库管理',
      description: '管理 RAG 知识库内容',
      color: 'var(--color-tech)',
    },
  ];

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back Link */}
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          返回账户
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-gold)] flex items-center justify-center mx-auto mb-4">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <h1
            className="text-3xl font-bold text-[var(--color-text-primary)] mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            管理后台
          </h1>
          <p className="text-[var(--color-text-muted)]">
            欢迎，{me?.username}！管理系统配置和内容
          </p>
        </div>

        {/* Menu Items */}
        <div className="space-y-4">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="card card-hover p-6 flex items-center gap-4 group"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white transition-transform group-hover:scale-110"
                style={{ backgroundColor: item.color }}
              >
                {item.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  {item.title}
                </h3>
                <p className="text-sm text-[var(--color-text-muted)]">
                  {item.description}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-[var(--color-text-hint)] group-hover:text-[var(--color-gold)] transition-colors" />
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-[var(--color-text-hint)]">
            一盏大师 · 管理控制台
          </p>
        </div>
      </div>
    </main>
  );
}
