import { Suspense } from 'react';
import LoginClient from './LoginClient';

// 可选：如果页面静态导出时仍报错，可开启动态渲染
export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LoginClient />
    </Suspense>
  );
}