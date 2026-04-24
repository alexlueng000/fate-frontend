'use client';

import { ReactNode, useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Header from './components/Header';
import TopNav from './components/Navigation/TopNav';
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

  // 判断是否显示功能导航（只在三个主功能页面显示）
  const showFunctionNav = ['/panel', '/xinji', '/liuyao'].some(path =>
    pathname === path || pathname.startsWith(path + '/')
  );

  return (
    <div className="flex flex-col h-screen">
      <DisclaimerModal
        open={showDisclaimer}
        onAccept={handleAcceptDisclaimer}
      />
      <Header />

      {/* 桌面端：顶部功能导航 */}
      {showFunctionNav && (
        <div className="hidden md:block">
          <TopNav />
        </div>
      )}

      {/* 主内容区 */}
      <main className={`flex-1 overflow-auto ${showFunctionNav ? 'mt-14 md:mt-0 mb-16 md:mb-0' : 'mt-14'}`}>
        {children}
      </main>

      {/* 移动端：底部功能导航 */}
      {showFunctionNav && (
        <div className="md:hidden">
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
