type ProfileStatusLike = {
  hasProfile?: boolean;
} | null | undefined;

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
  if (redirectTarget && isGuestAnalysisContinuePath(redirectTarget)) {
    return redirectTarget;
  }

  if (!status?.hasProfile) {
    return '/profile/create';
  }

  return redirectTarget || '/dashboard';
}
