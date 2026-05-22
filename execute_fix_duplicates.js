const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length > 0) {
        env[key.trim()] = rest.join('=').trim().replace(/'/g, '').replace(/"/g, '');
    }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function executeFix() {
  if (!fs.existsSync('duplicates_to_fix.json')) {
    console.error("duplicates_to_fix.json not found!");
    return;
  }

  const { usersToDeduct, duplicateTxsToUpdate } = JSON.parse(fs.readFileSync('duplicates_to_fix.json', 'utf8'));

  console.log(`Starting to process ${duplicateTxsToUpdate.length} duplicate transactions...`);

  // 1. Mark duplicate transactions as 'duplicate' status
  for (const txId of duplicateTxsToUpdate) {
    const { error } = await supabase
      .from('transactions')
      .update({ status: 'duplicate' })
      .eq('id', txId);
    
    if (error) {
      console.error(`Failed to update tx ${txId}:`, error);
    } else {
      console.log(`Marked tx ${txId} as duplicate.`);
    }
  }

  // 2. Deduct balances
  console.log(`\nStarting to update balances for ${Object.keys(usersToDeduct).length} users...`);
  
  for (const [userId, user] of Object.entries(usersToDeduct)) {
    const { data: profile, error: pError } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', userId)
      .single();

    if (pError || !profile) {
      console.error(`Failed to fetch user ${userId} (${user.email})`, pError);
      continue;
    }

    const newBalance = profile.balance - user.totalDeduction;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', userId);

    if (updateError) {
      console.error(`Failed to update balance for user ${userId} (${user.email}):`, updateError);
    } else {
      console.log(`Updated user ${user.email} | Old: R$ ${profile.balance.toFixed(2)} | Deducted: R$ ${user.totalDeduction.toFixed(2)} | New: R$ ${newBalance.toFixed(2)}`);
    }
  }

  console.log("\nFix applied successfully.");
}

executeFix();
