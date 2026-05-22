const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const userId = 'd0c02bb4-a535-4900-bf1f-8666d089dd9d'; // Alec
  const paymentId = 'STATIC_1778356827589_Alec';
  const amount = 12;

  // Update profile balance
  const { data: profile } = await supabaseAdmin.from('profiles').select('balance').eq('id', userId).single();
  const currentBalance = profile.balance || 0;
  const newBalance = currentBalance + amount;

  await supabaseAdmin.from('profiles').update({ balance: newBalance }).eq('id', userId);
  await supabaseAdmin.from('transactions').update({ status: 'success' }).eq('external_id', paymentId);
  
  console.log(`Balance updated from ${currentBalance} to ${newBalance}`);
}
main();
