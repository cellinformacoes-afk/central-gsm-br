const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function reset() {
    console.log("Resetting task 267fe453-c867-4210-bdc7-e953806f3561 to pending...");
    const { data, error } = await supabase
        .from('automation_tasks')
        .update({ status: 'pending', error_message: null })
        .eq('id', '267fe453-c867-4210-bdc7-e953806f3561');
        
    if (error) {
        console.error("Update Error:", error.message);
    } else {
        console.log("Task successfully reset!");
    }
}

reset();
