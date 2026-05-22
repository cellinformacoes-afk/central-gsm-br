const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrders() {
    const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .ilike('service_title', '%sansung tool%')
        .order('created_at', { ascending: false })
        .limit(20);
    
    if (error) {
        console.error("Orders Error:", error);
    } else {
        console.log(`Found ${orders.length} orders for sansung tool:`);
        orders.forEach(o => {
            console.log(o.created_at, o.service_title, o.input_data, o.status);
        });
    }
}
checkOrders();
