'use client';

import { ReactNode, useEffect } from 'react';
import Header from './components/Header';
import { UserProvider, useUser, fetchMe } from './lib/auth';

function LayoutBody({ children }: { children: ReactNode }) {
  const { user, setUser } = useUser();

  useEffect(() => {
    if (!user) {
      void fetchMe().then((u) => { if (u) setUser(u); });
    }
  }, [user, setUser]);

  return (
    <>
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
