import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cachedAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cachedAdmin) return cachedAdmin;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !serviceRoleKey) {
    return createClient('https://placeholder.supabase.co', 'placeholder', {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  cachedAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cachedAdmin;
}

export const supabaseAdmin = getSupabaseAdmin();