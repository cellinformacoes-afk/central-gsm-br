function getStoredSession(): { access_token: string; refresh_token: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const key = Object.keys(localStorage).find(k => k.endsWith('-auth-token'));
    if (!key) return null;
    const raw = JSON.parse(localStorage.getItem(key) || '{}');
    const session = raw?.currentSession;
    if (!session?.access_token || !session?.refresh_token) return null;
    return session;
  } catch {
    return null;
  }
}

function getStoredToken(): string | null {
  return getStoredSession()?.access_token || null;
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

function saveSession(session: any) {
  if (typeof window === 'undefined') return;
  const key = Object.keys(localStorage).find(k => k.endsWith('-auth-token'));
  if (key) {
    localStorage.setItem(key, JSON.stringify({
      currentSession: session,
      expiresAt: session.expires_at || (Math.floor(Date.now() / 1000) + (session.expires_in || 3600)),
    }));
  }
}

async function refreshIfNeeded(): Promise<string | null> {
  const session = getStoredSession();
  if (!session) return null;
  if (!isTokenExpired(session.access_token)) return session.access_token;

  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    });
    const data = await res.json();

    if (!res.ok || data.error || !data.session) {
      return null;
    }

    saveSession(data.session);
    return data.session.access_token;
  } catch {
    return null;
  }
}

export function clearStoredSession() {
  if (typeof window === 'undefined') return;
  const key = Object.keys(localStorage).find(k => k.endsWith('-auth-token'));
  if (key) localStorage.removeItem(key);
}

export async function fetchAuthSession() {
  const token = await refreshIfNeeded();
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
