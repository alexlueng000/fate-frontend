'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkRouteAccess } from './auth';

/**
 * 路由守卫 Hook
 *
 * @param requireAuth - 是否需要登录
 * @param requireProfile - 是否需要建档
 * @returns loading 状态
 *
 * @example
 * // 需要登录和建档的页面（如聊天页）
 * const loading = useRouteGuard(true, true);
 * if (loading) return <div>加载中...</div>;
 *
 * @example
 * // 只需要登录的页面（如建档页）
 * const loading = useRouteGuard(true, false);
 * if (loading) return <div>加载中...</div>;
 */
export function useRouteGuard(
  requireAuth: boolean = false,
  requireProfile: boolean = false
): boolean {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const result = await checkRouteAccess(requireAuth, requireProfile);

      if (!mounted) return;

      if (!result.allowed) {
        router.replace(result.redirect);
      } else {
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [requireAuth, requireProfile, router]);

  return loading;
}
