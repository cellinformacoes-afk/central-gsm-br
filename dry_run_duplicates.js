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

async function findDuplicates() {
  console.log("Fetching successful transactions...");
  const { data: txs, error } = await supabase
    .from('transactions')
    .select('id, user_id, amount, description, created_at, profiles(email, balance)')
    .eq('status', 'success')
    .order('created_at', { ascending: false })
    .limit(1000);

  if (error) {
    console.error("Error fetching txs:", error);
    return;
  }

  // Group by description (which contains the Asaas Pix ID)
  const grouped = {};
  txs.forEach(tx => {
    // Only group Asaas IDs (starts with ftn_ or pay_ or PIX_WH_)
    if (tx.description && (tx.description.startsWith('ftn_') || tx.description.startsWith('pay_') || tx.description.startsWith('PIX_WH_'))) {
      if (!grouped[tx.description]) {
        grouped[tx.description] = [];
      }
      grouped[tx.description].push(tx);
    }
  });

  const usersToDeduct = {};
  const duplicateTxsToUpdate = [];

  Object.entries(grouped).forEach(([description, txList]) => {
    if (txList.length > 1) {
      // Sort by created_at ascending (first one is the original)
      txList.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      
      const original = txList[0];
      const duplicates = txList.slice(1);

      duplicates.forEach(dup => {
        const uid = dup.user_id;
        if (!usersToDeduct[uid]) {
          usersToDeduct[uid] = {
            email: dup.profiles?.email,
            currentBalance: dup.profiles?.balance,
            totalDeduction: 0,
            duplicateIds: []
          };
        }
        usersToDeduct[uid].totalDeduction += parseFloat(dup.amount);
        usersToDeduct[uid].duplicateIds.push(dup.id);
        duplicateTxsToUpdate.push(dup.id);
      });
    }
  });

  console.log("--- DRY RUN RESULTS ---");
  console.log(`Found ${duplicateTxsToUpdate.length} duplicate transactions.`);
  
  Object.values(usersToDeduct).forEach(user => {
    const newBalance = user.currentBalance - user.totalDeduction;
    console.log(`User ${user.email}:`);
    console.log(`  - Duplicated amount: R$ ${user.totalDeduction.toFixed(2)}`);
    console.log(`  - Current balance: R$ ${parseFloat(user.currentBalance).toFixed(2)}`);
    console.log(`  - Balance after fix: R$ ${newBalance.toFixed(2)}`);
  });

  // Save the state to a json file to be executed by the fix script
  fs.writeFileSync('duplicates_to_fix.json', JSON.stringify({ usersToDeduct, duplicateTxsToUpdate }, null, 2));
  console.log("\nDetails saved to duplicates_to_fix.json");
}

findDuplicates();
