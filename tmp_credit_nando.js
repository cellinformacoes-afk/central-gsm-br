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
  const txId = '181a5013-1ee6-4537-abb2-57d150602125';
  const userId = 'd78ca18c-bb9e-43db-953e-615dafe60d74';
  const amount = 12;

  // 1. Mark transaction as success only if it is pending
  const { data: updatedTx, error: txError } = await supabase
    .from('transactions')
    .update({ status: 'success', description: 'Creditado Manualmente (Suporte)' })
    .eq('id', txId)
    .eq('status', 'pending')
    .select();

  if (txError) {
    console.error('Error updating transaction:', txError);
    return;
  }

  if (!updatedTx || updatedTx.length === 0) {
    console.log('Transaction was not pending or not found. No credit applied to avoid double credit.');
    return;
  }

  console.log('Transaction successfully marked as success:', updatedTx);

  // 2. Fetch current balance
  const { data: profile, error: pError } = await supabase
    .from('profiles')
    .select('balance')
    .eq('id', userId)
    .single();

  if (pError || !profile) {
    console.error('Error fetching profile:', pError);
    return;
  }

  const newBalance = (profile.balance || 0) + amount;

  // 3. Update balance
  const { data: updatedProfile, error: updateError } = await supabase
    .from('profiles')
    .update({ balance: newBalance })
    .eq('id', userId)
    .select();

  if (updateError) {
    console.error('Error updating profile balance:', updateError);
    return;
  }

  console.log('Balance successfully updated. New balance:', updatedProfile[0].balance);
}

credit();
