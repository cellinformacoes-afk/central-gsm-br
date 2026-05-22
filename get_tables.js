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

async function checkWebhooks() {
  const today = '2026-05-13T12:00:00Z'; // check all from today
  
  const { data: logs, error } = await supabase
    .from('webhook_logs')
    .select('*')
    .gte('created_at', today)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error(error);
    return;
  }
  
  console.log("Recent webhook logs:");
  logs.forEach(log => {
      console.log(`[${log.created_at}] Payload:`, JSON.stringify(log.payload));
  });
}

checkWebhooks();
