const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkDatabaseSchema() {
  console.log("Checking profiles table constraints...");
  
  const { data: constraints, error: constError } = await supabase.rpc('get_table_constraints', { t_name: 'profiles' });
  
  if (constError) {
      // If RPC doesn't exist, try a direct query to information_schema
      const { data: directData, error: directError } = await supabase.from('profiles').select('*').limit(0);
      console.log("Direct select error (to check column presence):", directError);
      
      // Try to find the constraint using raw SQL
      const { data: sqlData, error: sqlError } = await supabase.rpc('execute_sql', { 
        query: "SELECT conname FROM pg_constraint WHERE conrelid = 'public.profiles'::regclass" 
      });
      console.log("Constraints from SQL:", sqlData);
  } else {
      console.log("Constraints from RPC:", constraints);
  }

  console.log("\nChecking for duplicate CPFs in profiles...");
  const { data: duplicates, error: dupError } = await supabase.rpc('execute_sql', {
      query: "SELECT cpf, count(*) FROM public.profiles GROUP BY cpf HAVING count(*) > 1"
  });
  console.log("Duplicate CPFs in DB:", duplicates);
}

checkDatabaseSchema();
