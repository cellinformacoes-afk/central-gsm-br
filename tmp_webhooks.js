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
  const { data: logs, error } = await supabase.from('webhook_logs')
    .select('*')
    .eq('source', 'asaas_webhook')
    .order('created_at', { ascending: false })
    .limit(20);

  logs.forEach(log => {
    const ev = log.payload && log.payload.event;
    console.log(`[${log.created_at}] Event: ${ev}`);
  });
}
checkWebhooks();
