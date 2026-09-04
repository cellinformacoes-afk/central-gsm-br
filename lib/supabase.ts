import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  global: {
    fetch: (...args) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      return fetch(args[0], { ...args[1], signal: controller.signal }).finally(() => clearTimeout(timeout));
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
