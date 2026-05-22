require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecentUsers() {
  console.log("Checking recently registered users to find this client...");
  
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, balance, created_at')
    .order('created_at', { ascending: false })
    .limit(20);
    
  if (profileError) {
    console.error("Error fetching profiles:", profileError);
    return;
  }
  
  console.table(profiles.map(p => ({
    email: p.email,
    balance: p.balance,
    created: new Date(p.created_at).toLocaleString()
  })));
  
  console.log("\nChecking recent payments to see if there's a payment matching this email...");
  const { data: payments, error: paymentError } = await supabase
    .from('payments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (!paymentError && payments) {
    console.table(payments.map(p => ({
      email: p.customer_email || p.email || 'N/A',
      value: p.value || p.amount,
      status: p.status,
      created: new Date(p.created_at).toLocaleString()
    })));
  } else if (paymentError) {
    console.error("Error fetching payments:", paymentError.message);
  }
}

checkRecentUsers();
