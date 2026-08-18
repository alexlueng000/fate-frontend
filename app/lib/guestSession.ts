const GUEST_SESSION_KEY = 'fate_guest_session_id';

function fallbackId(): string {
  const random = Math.random().toString(36).slice(2);
  return `guest_${Date.now().toString(36)}_${random}`;
}

export function getGuestSessionId(): string {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return fallbackId();
  }

  const existing = localStorage.getItem(GUEST_SESSION_KEY);
  if (existing) return existing;

  const next =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : fallbackId();
  localStorage.setItem(GUEST_SESSION_KEY, next);
  return next;
}
