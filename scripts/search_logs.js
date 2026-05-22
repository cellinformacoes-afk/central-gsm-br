const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function searchWebhookLogs() {
    const { data: logs, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);
    
    if (error) {
        console.error(error);
    } else if (logs) {
        const found = logs.filter(log => JSON.stringify(log.payload).includes('25187164'));
        console.log(`Found ${found.length} logs with 25187164`);
        found.forEach(log => console.log(JSON.stringify(log.payload)));
    }
}
searchWebhookLogs();
