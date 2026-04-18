const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    // This is a trick to get all tables if schema is not protected
    const { data, error } = await supabase.rpc('get_tables_info'); // if exists
    
    if (error) {
         // Fallback: search for common tables
         const tables = ['services', 'categories', 'orders', 'transactions', 'service_accounts', 'profiles', 'active_plans'];
         for (const table of tables) {
             const { data, error } = await supabase.from(table).select('*').limit(1);
             if (!error) {
                 console.log(`Table: ${table}, Columns:`, data.length > 0 ? Object.keys(data[0]) : 'Empty');
             }
         }
    } else {
        console.log(data);
    }
}

listTables();
