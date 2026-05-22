const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function findTables() {
    const { data, error } = await supabase.rpc('get_tables_info');
    if (error) {
        console.log("No get_tables_info rpc, falling back to direct query");
        
        // try to see if there are any history tables
        const tablesToTry = ['password_history', 'service_account_history', 'logs', 'audit_logs', 'orders', 'transactions'];
        for (const table of tablesToTry) {
             const { data, error } = await supabase.from(table).select('*').limit(1);
             if (!error && data) {
                 console.log(`Table exists: ${table}`);
             }
        }
    } else {
        console.log(data);
    }
}
findTables();
