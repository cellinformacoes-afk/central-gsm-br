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

async function getTodaysDeposits() {
  // Hoje no Brasil começa em 2026-05-13T03:00:00Z
  const todayStart = '2026-05-13T03:00:00Z';

  const { data: txs, error: txError } = await supabase
    .from('transactions')
    .select('id, amount, created_at, status, description, type, user_id, profiles(email, username)')
    .eq('status', 'success')
    .gte('created_at', todayStart)
    .gt('amount', 0)
    .order('created_at', { ascending: true });

  if (txError) {
    console.error("Tx Error", txError);
    return;
  }
  
  let total = 0;
  console.log("--- ENTRADAS DE HOJE ---");
  txs.forEach((tx, index) => {
    total += parseFloat(tx.amount);
    // converte utc para brasil
    const dt = new Date(tx.created_at);
    dt.setHours(dt.getHours() - 3);
    const timeStr = dt.toISOString().split('T')[1].substring(0, 8);
    const email = tx.profiles?.email || 'N/A';
    const desc = tx.description || 'N/A';
    console.log(`${String(index + 1).padStart(2, '0')} | ${timeStr} | R$ ${parseFloat(tx.amount).toFixed(2).padStart(6, ' ')} | ${email} | ${desc}`);
  });
  console.log("------------------------");
  console.log(`TOTAL: R$ ${total.toFixed(2)}`);
}

getTodaysDeposits();
