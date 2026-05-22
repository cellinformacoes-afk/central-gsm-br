const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const email = 'Deenysilva7250@gmail.com';
    const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', email);
    
    console.log('--- PROFILES ---');
    console.log(profiles);

    if (profiles && profiles.length > 0) {
        const userId = profiles[0].id;
        console.log(`\n--- TRANSACTIONS FOR ${userId} ---`);
        const { data: txs } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20);
        console.log(txs);

        console.log(`\n--- PIX PAYMENTS FOR ${userId} ---`);
        const { data: pix } = await supabase
            .from('pix_payments')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20);
        console.log(pix);

        console.log(`\n--- ASAAS PAYMENTS FOR ${userId} ---`);
        const { data: asaas } = await supabase
            .from('asaas_payments')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20);
        console.log(asaas);
    }
}
check();
