require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function creditUser() {
  const userId = '1b8f080e-7c8d-4a83-a639-c233511aad3c';
  const amountToCredit = 28;
  
  console.log(`Crediting user ${userId} with R$ ${amountToCredit}...`);
  
  // 1. Get current balance
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('balance')
    .eq('id', userId)
    .single();
    
  if (profileError) {
    console.error("Error fetching profile:", profileError);
    return;
  }
  
  const newBalance = profile.balance + amountToCredit;
  console.log(`Current balance: ${profile.balance}. New balance: ${newBalance}`);
  
  // 2. Update balance
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ balance: newBalance })
    .eq('id', userId);
    
  if (updateError) {
    console.error("Error updating balance:", updateError);
    return;
  }
  
  // 3. Find pending transaction to update
  const { data: pendingTxs, error: pendingError } = await supabase
    .from('transactions')
    .select('id')
    .eq('user_id', userId)
    .eq('amount', amountToCredit)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1);
    
  if (pendingError || !pendingTxs || pendingTxs.length === 0) {
    console.log("No pending transaction found to update. Creating a new success transaction.");
    // Create new transaction
    await supabase.from('transactions').insert({
      user_id: userId,
      amount: amountToCredit,
      type: 'pix',
      status: 'success',
      description: 'Crédito manual - PIX confirmado pelo suporte'
    });
  } else {
    console.log(`Updating pending transaction ${pendingTxs[0].id} to success...`);
    // Update existing transaction
    await supabase
      .from('transactions')
      .update({ 
        status: 'success',
        description: 'Crédito manual - PIX confirmado pelo suporte'
      })
      .eq('id', pendingTxs[0].id);
  }
  
  console.log("Done!");
}

creditUser();
