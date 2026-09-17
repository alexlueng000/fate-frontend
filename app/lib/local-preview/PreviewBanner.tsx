'use client';

import Link from 'next/link';

export default function PreviewBanner() {
  return (
    <aside aria-label="本地演示模式" className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <p><strong>本地演示 · 模拟数据</strong>　无需登录，不连接数据库或 AI。命盘及回复均为固定示例，操作不影响线上。</p>
      <nav aria-label="演示页面" className="mt-2 flex flex-wrap gap-x-5 gap-y-2 underline underline-offset-4">
        <Link href="/">官网首页</Link>
        <Link href="/dashboard">登录后首页</Link>
        <Link href="/report">命盘报告</Link>
        <Link href="/chat?conv_id=9001">历史对话</Link>
        <Link href="/panel">开始咨询</Link>
        <Link href="/history">历史记录</Link>
        <Link href="/admin/dashboard">统计看板</Link>
      </nav>
      <p className="mt-1 text-xs">展示当前已实现的页面；编辑、删除、支付等未模拟操作会提示不可用。关闭演示请停止服务。</p>
    </aside>
  );
}
