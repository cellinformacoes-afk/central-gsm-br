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

async function creditUser() {
  const email = 'vitormalior28@gmail.com';
  const targetBalance = 25.04;

  const { data: profile, error: pError } = await supabase
    .from('profiles')
    .select('*')
    .ilike('email', email)
    .single();

  if (pError || !profile) {
    console.error("Profile not found:", pError);
    return;
  }

  console.log(`Current balance for ${email}:`, profile.balance);
  const amountToAdd = targetBalance - profile.balance;
  
  if (Math.abs(amountToAdd) < 0.01) {
     console.log("Balance is already at target.");
     return;
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ balance: targetBalance })
    .eq('id', profile.id);

  if (updateError) {
    console.error("Failed to update balance:", updateError);
    return;
  }

  console.log(`Successfully updated balance to ${targetBalance}. Amount added: ${amountToAdd.toFixed(2)}`);

  // Insert a new transaction record to keep history intact
  await supabase
    .from('transactions')
    .insert({
      user_id: profile.id,
      amount: Number(amountToAdd.toFixed(2)),
      status: 'success',
      type: 'pix',
      description: `Creditado manualmente via script (Pagamento gorjeta / externo)`
    });
  console.log("Inserted new successful transaction for the manual credit.");
}

creditUser();
