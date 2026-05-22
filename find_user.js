const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length > 0) {
        env[key.trim()] = rest.join('=').trim().replace(/'/g, '').replace(/"/g, '');
    }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function findUser() {
  const today = '2026-05-13T16:00:00Z';
  
  // Get pending pix transactions today
  const { data: txs, error: txError } = await supabase
    .from('transactions')
    .select('*')
    .eq('type', 'pix')
    .eq('status', 'pending')
    .gte('created_at', today)
    .order('created_at', { ascending: false });

  if (txError) {
    console.error("Tx Error", txError);
    return;
  }
  
  console.log("Pending Pix transactions:", txs);

  for (const tx of txs) {
    // try to fetch profile
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', tx.user_id).single();
    if (profile) {
      console.log(`Profile for tx ${tx.id}:`, profile);
    } else {
      // maybe auth.users
      const { data: user } = await supabase.auth.admin.getUserById(tx.user_id);
      if (user && user.user) {
        console.log(`Auth user for tx ${tx.id}:`, user.user.email);
      }
    }
  }
}

findUser();
