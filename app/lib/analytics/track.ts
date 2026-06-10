// app/lib/analytics/track.ts
import { api } from '@/app/lib/api';

type EventPayload = Record<string, string | number | boolean | null | undefined>;

type TrackEventOptions = {
  source?: string;
  pagePath?: string;
  payload?: EventPayload;
};

const SESSION_KEY = 'analytics:session_id';

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function createSessionId(): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${Date.now().toString(36)}-${random}`;
}

function getSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const next = createSessionId();
    sessionStorage.setItem(SESSION_KEY, next);
    return next;
  } catch {
    return null;
  }
}

export function trackEvent(eventName: string, options: TrackEventOptions = {}) {
  if (typeof window === 'undefined') return;

  const pagePath = options.pagePath ?? `${window.location.pathname}${window.location.search}`;
  const body = {
    event_name: eventName,
    event_source: options.source ?? 'web',
    page_path: pagePath,
    payload: options.payload ?? null,
    session_id: getSessionId(),
  };

  fetch(api('/events/track'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    credentials: 'include',
    body: JSON.stringify(body),
  }).catch(() => {});
}

