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

async function checkRecent() {
  const today = '2026-05-13T16:00:00Z';
  
  console.log("--- RECENT PROFILES ---");
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('id, email, balance')
    .in('id', ['41bf162a-dc85-40b9-8e41-0f66b539c805', 'c0f4dfbc-a89a-4122-b5e1-9cf720f4c0ee']);
  if (pError) console.error(pError);
  else console.log(profiles);

  console.log("\n--- DEPOSITS TODAY ---");
  const { data: deposits, error: depError } = await supabase
    .from('deposits')
    .select('*')
    .gte('created_at', today)
    .order('created_at', { ascending: false });
  if (depError) console.error(depError);
  else console.log(deposits);
}

checkRecent();
