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
  const txId = '7281fa70-9b3f-4519-997a-298dd829d469'; // 15 reais tx
  const userId = 'b437c5ef-685c-43ef-b0dd-d1e6f954d4c7';
  const amount = 15;

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
