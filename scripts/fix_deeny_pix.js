const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const userId = 'e58c2386-2e0a-4b53-b5a1-64fe41c6268a';
  const paymentId = 'STATIC_1778424071075_Deeny';
  const amount = 12;

  // Update profile balance
  const { data: profile } = await supabaseAdmin.from('profiles').select('balance').eq('id', userId).single();
  const currentBalance = profile.balance || 0;
  const newBalance = currentBalance + amount;

  await supabaseAdmin.from('profiles').update({ balance: newBalance }).eq('id', userId);
  await supabaseAdmin.from('transactions').update({ status: 'success' }).eq('external_id', paymentId);
  
  console.log(`Balance updated from ${currentBalance} to ${newBalance} for user ${userId}`);
}
main();
