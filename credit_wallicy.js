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

async function credit() {
  const email = 'wallicyabreu@gmail.com';
  const amountToAdd = 12;
  const asaasId = 'ftn_001839555776';

  const { data: profile, error: pError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single();

  if (pError || !profile) {
    console.error("Profile not found for email:", email, pError);
    return;
  }

  console.log(`Current balance for ${email}:`, profile.balance);
  const newBalance = profile.balance + amountToAdd;

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ balance: newBalance })
    .eq('id', profile.id);

  if (updateError) {
    console.error("Failed to update balance:", updateError);
    return;
  }

  console.log(`Successfully added ${amountToAdd}. New balance:`, newBalance);

  // Update the specific pending transaction for this user
  const { data: pendingTxs } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', profile.id)
    .eq('status', 'pending');

  if (pendingTxs && pendingTxs.length > 0) {
    for (const tx of pendingTxs) {
      await supabase
        .from('transactions')
        .update({ status: 'success', description: asaasId })
        .eq('id', tx.id);
      console.log(`Updated pending tx ${tx.id} to success with description ${asaasId}.`);
    }
  } else {
    // Insert a new transaction record
    await supabase
      .from('transactions')
      .insert({
        user_id: profile.id,
        amount: amountToAdd,
        status: 'success',
        type: 'pix',
        description: asaasId,
        external_id: 'STATIC_MANUAL_' + Date.now()
      });
    console.log("Inserted new successful transaction for the manual credit.");
  }
}

credit();
