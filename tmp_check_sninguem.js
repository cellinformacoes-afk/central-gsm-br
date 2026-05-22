require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
  const email = 'Sninguem35@gmail.com';
  
  console.log(`Checking user: ${email}`);
  
  // Get user profile
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .ilike('email', email);
    
  if (profileError) {
    console.error("Error fetching profile:", profileError);
    return;
  }
  
  if (!profiles || profiles.length === 0) {
    console.log("User not found in profiles table.");
    return;
  }
  
  const user = profiles[0];
  console.log("\n--- Profile ---");
  console.log(`ID: ${user.id}`);
  console.log(`Email: ${user.email}`);
  console.log(`Current Balance: ${user.balance}`);
  
  // Get recent deposits/transactions
  console.log("\n--- Recent Deposits/Transactions ---");
  const { data: deposits, error: depositError } = await supabase
    .from('deposits')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);
    
  if (depositError) {
    // If deposits table doesn't exist, try transactions or payments
    console.log("Error fetching deposits, might not exist or different table name:", depositError.message);
    
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (!txError && transactions) {
       console.log("Transactions table:");
       console.log(transactions);
    }
  } else {
    console.log("Deposits table:");
    console.log(deposits);
  }
}

checkUser();
