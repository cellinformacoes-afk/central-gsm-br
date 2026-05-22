require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDeposits() {
  const email = 'Sninguem35@gmail.com';
  
  console.log(`Checking deposits table for email containing: ${email}`);
  
  const { data: deposits, error } = await supabase
    .from('deposits')
    .select('*')
    .ilike('customer_email', `%${email.split('@')[0]}%`)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error("Error:", error);
  } else {
    console.table(deposits.map(d => ({
      id: d.id,
      user_id: d.user_id,
      customer_email: d.customer_email,
      amount: d.amount,
      status: d.status,
      created: new Date(d.created_at).toLocaleString()
    })));
  }
}

checkDeposits();
