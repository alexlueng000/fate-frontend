const DISCLAIMER_KEY = 'disclaimer:accepted';

export function hasAcceptedDisclaimer(): boolean {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return false;
  }
  try {
    return localStorage.getItem(DISCLAIMER_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setDisclaimerAccepted(): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(DISCLAIMER_KEY, 'true');
  } catch {
    // 静默失败
  }
}
