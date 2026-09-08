type ProfileStatusLike = {
  hasProfile?: boolean;
} | null | undefined;

const LOCAL_ORIGIN = 'https://local.invalid';
const PROFILE_ROUTES = ['/chat', '/report', '/profile/view', '/profile/edit'];

/** Only accept same-site destinations, never authentication loops or external URLs. */
export function safePostAuthTarget(path: string | null): string | null {
  if (!path || !path.startsWith('/') || path.startsWith('//') || /[\\\u0000-\u0020]/.test(path)) return null;
  try {
    const url = new URL(path, LOCAL_ORIGIN);
    const decodedPath = decodeURIComponent(url.pathname).replace(/\/+$/, '') || '/';
    if (url.origin !== LOCAL_ORIGIN || decodedPath.startsWith('//') || decodedPath.includes('\\')) return null;
    if (['/login', '/register', '/forgot-password', '/reset-password'].some((route) => decodedPath === route || decodedPath.startsWith(`${route}/`))) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function profileReturnTarget(path: string | null): string {
  const safe = safePostAuthTarget(path);
  if (!safe) return '/report';
  const pathname = decodeURIComponent(new URL(safe, LOCAL_ORIGIN).pathname).replace(/\/+$/, '') || '/';
  if (['/', '/profile/create', '/analysis/start'].includes(pathname)) return '/report';
  return safe;
}

export function profileSetupTarget(path: string | null): string {
  const target = safePostAuthTarget(path);
  return target ? `/profile/create?next=${encodeURIComponent(target)}` : '/profile/create';
}

export function isGuestAnalysisContinuePath(path: string | null): boolean {
  if (!path) return false;
  try {
    const url = new URL(path, 'http://local');
    return url.pathname.startsWith('/analysis/result/') && url.searchParams.get('intent') === 'bind_continue';
  } catch {
    return false;
  }
}

export function resolvePostAuthRedirect(
  status: ProfileStatusLike,
  redirectTarget: string | null,
): string {
  const target = safePostAuthTarget(redirectTarget);
  if (target && isGuestAnalysisContinuePath(target)) return target;

  if (!status?.hasProfile) {
    if (target) {
      const pathname = decodeURIComponent(new URL(target, LOCAL_ORIGIN).pathname).replace(/\/+$/, '') || '/';
      if (PROFILE_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
        return profileSetupTarget(target);
      }
      if (!['/', '/dashboard', '/analysis/start'].includes(pathname)) return target;
    }
    return '/profile/create';
  }

  return target || '/dashboard';
}
