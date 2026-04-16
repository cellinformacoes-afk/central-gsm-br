const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findIP() {
  const { data: logs } = await supabase.from('webhook_logs').select('*').limit(50);
  console.log("Logs sample:", logs.find(l => l.payload && l.payload.source === 'asaas_webhook'));
}
findIP();
