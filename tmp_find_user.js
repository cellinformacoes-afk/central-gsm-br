require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function findUser() {
  console.log("Searching for user with email containing 'ninguem' or '35'...");
  
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, balance, created_at')
    .or('email.ilike.%ninguem%,email.ilike.%35%');
    
  if (profileError) {
    console.error("Error fetching profiles:", profileError);
    return;
  }
  
  console.table(profiles.map(p => ({
    id: p.id,
    email: p.email,
    balance: p.balance,
    created: new Date(p.created_at).toLocaleString()
  })));
}

findUser();
