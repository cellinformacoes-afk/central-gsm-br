const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function investigate() {
  // 1. Achar o user
  const { data: profile } = await supabase.from('profiles').select('*').eq('email', 'shyyxn9@gmail.com').maybeSingle();
  if (!profile) {
     const { data: users } = await supabase.auth.admin.listUsers(); // might not have permission
     console.log("No profile found with this precise email, but lets try auth or ilike");
     const { data: p2 } = await supabase.from('profiles').select('*').ilike('email', '%shyyxn9%').maybeSingle();
     if(p2) { console.log('Found profile:', p2); investigateProfile(p2.id); }
  } else {
     console.log('Found profile:', profile);
     investigateProfile(profile.id);
  }
}

async function investigateProfile(userId) {
  const { data: transactions } = await supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: true });
  console.log('--- TRANSACTIONS ---');
  console.table(transactions);
  
  const { data: orders } = await supabase.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: true });
  console.log('--- ORDERS ---');
  console.table(orders);
}

investigate();
