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
  const session = getStoredSession();
  return session?.access_token || null;
}

async function refreshIfNeeded(): Promise<string | null> {
  const session = getStoredSession();
  if (!session) return null;

  const payload = JSON.parse(atob(session.access_token.split('.')[1]));
  const isExpired = payload.exp * 1000 < Date.now();

  if (!isExpired) return session.access_token;

  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    });

    const data = await res.json();

    if (!res.ok || data.error || !data.session) {
      clearStoredSession();
      return null;
    }

    const key = Object.keys(localStorage).find(k => k.endsWith('-auth-token'));
    if (key) {
      localStorage.setItem(key, JSON.stringify({
        currentSession: data.session,
        expires_at: Math.floor(Date.now() / 1000) + (data.session.expires_in || 3600),
      }));
    }

    return data.session.access_token;
  } catch {
    return null;
  }
}

export function clearStoredSession() {
  if (typeof window === 'undefined') return;
  try {
    const key = Object.keys(localStorage).find(k => k.endsWith('-auth-token'));
    if (key) localStorage.removeItem(key);
  } catch {}
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
  const session = getStoredSession();
  return session?.access_token || null;
}
