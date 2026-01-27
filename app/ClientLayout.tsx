'use client';

import { ReactNode, useEffect, useState, useRef } from 'react';
import Header from './components/Header';
import { UserProvider, useUser, fetchMe } from './lib/auth';
import { DisclaimerModal } from './components/DisclaimerModal';
import { hasAcceptedDisclaimer, setDisclaimerAccepted } from './lib/disclaimer';

function LayoutBody({ children }: { children: ReactNode }) {
  const { user, setUser } = useUser();
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const fetchAttempted = useRef(false);

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

  return (
    <>
      <DisclaimerModal
        open={showDisclaimer}
        onAccept={handleAcceptDisclaimer}
      />
      <Header />
      {children}
    </>
  );
}

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      <LayoutBody>{children}</LayoutBody>
    </UserProvider>
  );
}
