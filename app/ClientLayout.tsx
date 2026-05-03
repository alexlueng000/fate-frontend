'use client';

import { ReactNode, useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Header from './components/Header';
import SideNav from './components/Navigation/SideNav';
import BottomNav from './components/Navigation/BottomNav';
import { UserProvider, useUser, fetchMe } from './lib/auth';
import { DisclaimerModal } from './components/DisclaimerModal';
import { hasAcceptedDisclaimer, setDisclaimerAccepted } from './lib/disclaimer';

function LayoutBody({ children }: { children: ReactNode }) {
  const { user, setUser } = useUser();
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const fetchAttempted = useRef(false);
  const pathname = usePathname();

  // 检查用户认证（只执行一次）
  useEffect(() => {
    if (!user && !fetchAttempted.current) {
      fetchAttempted.current = true;
      void fetchMe().then((u) => { if (u) setUser(u); });
    }
  }, [user, setUser]);

  // 检查免责声明状态（延迟执行避免 SSR 问题）
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasAcceptedDisclaimer()) {
        setShowDisclaimer(true);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleAcceptDisclaimer = () => {
    setDisclaimerAccepted();
    setShowDisclaimer(false);
  };

  // 判断是否显示功能导航（只在主功能页面显示）
  const showFunctionNav = ['/report', '/panel', '/xinji', '/liuyao'].some(path =>
    pathname === path || pathname.startsWith(path + '/')
  );

  return (
    <div className="flex flex-col h-screen">
      <DisclaimerModal
        open={showDisclaimer}
        onAccept={handleAcceptDisclaimer}
      />

      {/* 固定顶部 Header */}
      <Header />

      {/* Header 下方区域：侧边栏 + 主内容 */}
      <div className="flex flex-1 overflow-hidden mt-14">
        {/* 桌面端：左侧功能导航 */}
        {showFunctionNav && <SideNav />}

        {/* 主内容区 */}
        <main className={`flex-1 overflow-auto ${showFunctionNav ? 'mb-16 sm:mb-0' : ''}`}>
          {children}
        </main>
      </div>

      {/* 移动端：底部功能导航 */}
      {showFunctionNav && (
        <div className="sm:hidden">
          <BottomNav />
        </div>
      )}
    </div>
  );
}

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      <LayoutBody>{children}</LayoutBody>
    </UserProvider>
  );
}
