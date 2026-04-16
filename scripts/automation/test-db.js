const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function test() {
    console.log("Testing Supabase Query for pending tasks...");
    console.log("URL:", supabaseUrl);
    
    const { data, error } = await supabase
        .from('automation_tasks')
        .select('*')
        .eq('status', 'pending')
        .order('type', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(1);
        
    if (error) {
        console.error("Query Error:", error.message);
    } else {
        console.log("Found tasks:", data.length);
        if (data.length > 0) {
            console.log("Next Task Type:", data[0].type);
            console.log("Next Task ID:", data[0].id);
            console.log("Next Task Service:", data[0].service_title);
        }
    }
}

test();
