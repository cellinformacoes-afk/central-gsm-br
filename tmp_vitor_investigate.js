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

async function investigate() {
  const email = 'vitormalior28@gmail.com';

  const { data: profile, error: pError } = await supabase
    .from('profiles')
    .select('*')
    .ilike('email', email)
    .single();

  if (pError || !profile) {
    console.error("Profile not found for email:", email, pError);
    return;
  }

  console.log(`=== PROFILE ===`);
  console.log(`ID: ${profile.id}`);
  console.log(`Username: ${profile.username}`);
  console.log(`Email: ${profile.email}`);
  console.log(`Current Balance: R$ ${profile.balance.toFixed(2)}`);
  
  console.log(`\n=== DEPOSITS (from transactions) ===`);
  const { data: deposits } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', profile.id)
    .eq('type', 'pix')
    .eq('status', 'success')
    .order('created_at', { ascending: true });

  let totalDeposited = 0;
  if (deposits) {
    deposits.forEach(tx => {
      console.log(`- Date: ${new Date(tx.created_at).toLocaleString()}, Amount: R$ ${tx.amount.toFixed(2)}`);
      totalDeposited += Number(tx.amount);
    });
  }
  console.log(`\n=> Total Deposited: R$ ${totalDeposited.toFixed(2)}`);
  
  console.log(`\n=== PURCHASES (from transactions) ===`);
  const { data: purchases } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', profile.id)
    .eq('type', 'purchase')
    .eq('status', 'success')
    .order('created_at', { ascending: true });

  let totalSpentFromTxs = 0;
  if (purchases) {
    purchases.forEach(tx => {
      console.log(`- Date: ${new Date(tx.created_at).toLocaleString()}, Desc: ${tx.description}, Amount: R$ ${Math.abs(tx.amount).toFixed(2)}`);
      totalSpentFromTxs += Math.abs(Number(tx.amount));
    });
  }
  console.log(`\n=> Total Spent (from txs): R$ ${totalSpentFromTxs.toFixed(2)}`);

  console.log(`\n=== ORDERS (from orders table) ===`);
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: true });

  let totalSpentOrders = 0;
  if (orders) {
    orders.forEach(o => {
      console.log(`- Date: ${new Date(o.created_at).toLocaleString()}, Service: ${o.service_title}, Price: R$ ${o.total_price.toFixed(2)}, Status: ${o.status}`);
      if (o.status !== 'Cancelado' && o.status !== 'refunded') { // Assuming 'Cancelado' is the status for cancelled orders
         totalSpentOrders += Number(o.total_price || 0);
      }
    });
  }
  console.log(`\n=> Total Spent (from successful orders): R$ ${totalSpentOrders.toFixed(2)}`);
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`Total Deposited: R$ ${totalDeposited.toFixed(2)}`);
  console.log(`Total Spent (Orders): R$ ${totalSpentOrders.toFixed(2)}`);
  console.log(`Total Spent (Transactions): R$ ${totalSpentFromTxs.toFixed(2)}`);
  console.log(`Current Balance: R$ ${profile.balance.toFixed(2)}`);
  console.log(`Theoretical Balance (Deposits - Orders): R$ ${(totalDeposited - totalSpentOrders).toFixed(2)}`);
}

investigate();
