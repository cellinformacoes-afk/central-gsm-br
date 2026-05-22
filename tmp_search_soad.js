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

async function searchUser() {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('email', '%soad%');

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log("Found profiles:", profiles.map(p => ({ id: p.id, email: p.email, balance: p.balance })));
}

searchUser();
