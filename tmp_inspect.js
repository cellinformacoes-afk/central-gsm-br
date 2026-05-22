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

async function inspect() {
  const email = 'vitormalior28@gmail.com';

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single();

  if (!profile) return;

  const { data: txs } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', profile.id)
    .limit(3);
  
  console.log("Tx sample:", txs);

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', profile.id)
    .limit(3);
    
  console.log("Order sample:", orders);
}

inspect();
