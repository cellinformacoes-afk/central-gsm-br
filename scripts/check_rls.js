const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkRLS() {
  const { data, error } = await supabase.rpc('execute_sql', {
    query: "SELECT tablename, policyname, roles, cmd, qual FROM pg_policies WHERE tablename = 'profiles'"
  });
  
  if (error) {
    console.error('Error checking RLS:', error);
  } else {
    console.log('RLS Policies for profiles:', JSON.stringify(data, null, 2));
  }
}

checkRLS();
