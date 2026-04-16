const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findIP() {
  const { data: logs } = await supabase.from('webhook_logs').select('*');
  const asaasLogs = logs.filter(l => JSON.stringify(l).includes('externalReference":"f3bd9f53'));
  console.log(asaasLogs);
}
findIP();
