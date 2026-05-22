require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTransactions() {
  const userId = '1b8f080e-7c8d-4a83-a639-c233511aad3c';
  
  console.log("Checking transactions for sninguen35@gmail.com...");
  
  const { data: txs, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (error) {
    console.error("Error fetching txs:", error);
  } else {
    console.table(txs.map(t => ({
      amount: t.amount,
      type: t.type,
      status: t.status,
      description: t.description,
      created: new Date(t.created_at).toLocaleString()
    })));
  }
}

checkTransactions();
