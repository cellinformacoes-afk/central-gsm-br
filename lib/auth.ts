function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const key = Object.keys(localStorage).find(k => k.endsWith('-auth-token'));
    if (!key) return null;
    const raw = JSON.parse(localStorage.getItem(key) || '{}');
    const token = raw?.currentSession?.access_token;
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp * 1000 < Date.now()) return null;
    return token;
  } catch {
    return null;
  }
}

export async function fetchAuthSession() {
  const token = getStoredToken();
  if (!token) return { session: null, profile: null };
  try {
    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: token }),
    });
    return res.json();
  } catch {
    return { session: null, profile: null };
  }
}

export function getStoredAccessToken(): string | null {
  return getStoredToken();
}
