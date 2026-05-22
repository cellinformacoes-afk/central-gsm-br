const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllTables() {
    // Try querying information_schema
    const { data, error } = await supabase.from('service_accounts').select('*');
    if (error) {
        console.error(error);
    } else {
        const sansungAccounts = data.filter(acc => {
            const creds = acc.credentials;
            return creds && JSON.stringify(creds).includes('25187164');
        });
        console.log("Samsung Accounts:", JSON.stringify(sansungAccounts, null, 2));
    }
}
listAllTables();
