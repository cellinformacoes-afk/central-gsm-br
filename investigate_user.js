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

async function investigate() {
  const email = 'wallicyabreu@gmail.com';

  const { data: profile, error: pError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single();

  if (pError || !profile) {
    console.error("Profile not found for email:", email, pError);
    return;
  }

  console.log(`Profile: id=${profile.id}, username=${profile.username}, email=${profile.email}, balance=${profile.balance}`);

  const { data: txs, error: txError } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(10);

  if (txError) {
    console.error("Tx Error", txError);
    return;
  }
  
  console.log("\nRecent Transactions:");
  txs.forEach(tx => console.log(tx));
}

investigate();
