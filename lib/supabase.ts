import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: async (url: string | Request, init?: RequestInit) => {
      const urlStr = typeof url === 'string' ? url : url.toString();

      if (urlStr.includes('/auth/v1/token') && urlStr.includes('grant_type=refresh_token')) {
        try {
          const body = init?.body ? JSON.parse(init.body as string) : {};
          const res = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: body.refresh_token }),
          });
          const data = await res.json();
          if (data.error || !data.session) {
            throw new Error(data.error || 'Refresh failed');
          }
          return new Response(JSON.stringify(data.session), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        } catch {
          return new Response(JSON.stringify({ error: { message: 'Refresh failed' } }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timeout));
    },
  },
});

export async function supabaseQueryWithRetry<T>(
  queryFn: () => Promise<T>,
  retries = 3,
  delay = 2000
): Promise<{ data: T | null; error: any }> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await queryFn();
      return { data: result, error: null };
    } catch (err: any) {
      if (attempt === retries) return { data: null, error: err };
      await new Promise(r => setTimeout(r, delay * attempt));
    }
  }
  return { data: null, error: new Error('Max retries exceeded') };
}
