'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<any>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('me');
      console.log(raw);
      if (!raw) {
        router.push('/login?redirect=/admin');
        return;
      }
      const user = JSON.parse(raw as string);
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
      <main className="min-h-screen flex items-center justify-center bg-[#fff7e8] text-[#4a2c2a]">
        <p>正在加载...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fff7e8] text-neutral-800 antialiased flex flex-col">
      {/* Hero 首屏 */}
      <section className="flex flex-1 items-center justify-center px-4 py-20 mt-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold leading-tight text-[#a83232]">
            一盏大师 · 八字 AI 解读（管理员）
          </h1>
          <p className="mt-4 text-lg text-[#4a2c2a]">
            欢迎，{me?.username}！您已登录管理员后台。
          </p>

          <div className="mt-8 flex flex-col gap-4">
            <a
              href="/admin/config/system_prompt"
              className="px-6 py-3 rounded-xl bg-[#a83232] text-white font-semibold hover:bg-[#822727] transition"
            >
              编辑系统提示词
            </a>
            <a
              href="/admin/config/quick_buttons"
              className="px-6 py-3 rounded-xl bg-[#4a2c2a] text-white font-semibold hover:bg-[#2c1b19] transition"
            >
              管理快捷按钮
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
