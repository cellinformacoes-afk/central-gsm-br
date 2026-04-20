const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function verifyLogs() {
  const { data, error, count } = await supabase
    .from('fraud_logs')
    .select('*', { count: 'exact' });

  if (error) {
    console.error('Error verifying logs:', error);
  } else {
    console.log(`Total fraud logs found in DB: ${count}`);
    console.log('Logs:', JSON.stringify(data, null, 2));
  }
}

verifyLogs();
