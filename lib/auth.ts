import { supabase } from '@/lib/supabase';

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const key = Object.keys(localStorage).find(k => k.endsWith('-auth-token'));
    if (!key) return null;
    const raw = JSON.parse(localStorage.getItem(key) || '{}');
    const session = raw?.currentSession;
    if (!session?.access_token) return null;
    return session.access_token;
  } catch {
    return null;
  }
}

function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const key = Object.keys(localStorage).find(k => k.endsWith('-auth-token'));
    if (!key) return null;
    const raw = JSON.parse(localStorage.getItem(key) || '{}');
    return raw?.currentSession?.refresh_token || null;
  } catch {
    return null;
  }
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
  let token = getStoredToken();
  if (!token) return null;
  if (!isTokenExpired(token)) return token;

  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    const data = await res.json();

    if (!res.ok || data.error || !data.session) return null;

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
  let token = await refreshIfNeeded();
  if (!token) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        token = session.access_token;
        if (isTokenExpired(token)) {
          const rt = session.refresh_token;
          if (rt) {
            const res = await fetch('/api/auth/refresh', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh_token: rt }),
            });
            const data = await res.json();
            if (res.ok && data.session) {
              await supabase.auth.setSession(data.session);
              token = data.session.access_token;
            }
          }
        }
      }
    } catch {}
  }

  if (!token) return { session: null, profile: null };

  try {
    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: token }),
    });
    const result = await res.json();
    if (result.session && result.profile) {
      return result;
    }
  } catch {}

  return { session: null, profile: null };
}

export function getStoredAccessToken(): string | null {
  return getStoredToken();
}
