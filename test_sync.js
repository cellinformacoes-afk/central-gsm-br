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

const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function sync() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const { data: pendingTxs, error: pendingError } = await supabaseAdmin
    .from('transactions')
    .select('*, profiles(email)')
    .eq('status', 'pending')
    .eq('type', 'pix')
    .gte('created_at', oneDayAgo);

  if (pendingError) throw pendingError;

  const asaasUrl = 'https://api.asaas.com/v3';
  const asaasKey = env.ASAAS_API_KEY || '';

  const [asaasPixRes, asaasFinRes] = await Promise.all([
    fetch(`${asaasUrl}/pix/transactions?limit=60`, { headers: { 'access_token': asaasKey } }),
    fetch(`${asaasUrl}/financialTransactions?limit=60`, { headers: { 'access_token': asaasKey } })
  ]);

  const asaasPixData = await asaasPixRes.json();
  const asaasFinData = await asaasFinRes.json();

  let allAsaasTxs = [...(asaasPixData.data || []), ...(asaasFinData.data || [])];
  const seenIds = new Set();
  allAsaasTxs = allAsaasTxs.filter(t => {
    if (seenIds.has(t.id)) return false;
    seenIds.add(t.id);
    return true;
  });

  const { data: usedTxs } = await supabaseAdmin
    .from('transactions')
    .select('description')
    .not('description', 'is', null)
    .eq('status', 'success')
    .limit(500);
  
  const usedAsaasIds = new Set(usedTxs?.map((tx) => tx.description) || []);

  const asaasTxsToProcess = allAsaasTxs.filter(t => !usedAsaasIds.has(t.id) && parseFloat(t.value || t.netValue || '0') > 0);

  const unmatchedAsaas = [];
  const matchedAsaasIds = new Set();

  for (const t of asaasTxsToProcess) {
    if (!matchedAsaasIds.has(t.id)) {
      const tValue = Math.abs(parseFloat(t.value || t.netValue || '0'));
      const suggestion = pendingTxs?.find(pt => Math.abs(parseFloat(pt.amount) - tValue) < 0.05);

      unmatchedAsaas.push({
        id: t.id,
        value: tValue,
        date: t.dateCreated || t.date,
        payer: t.payer?.name || t.description,
        suggested_email: suggestion?.profiles?.email || ''
      });
    }
  }

  console.log("Unmatched in Asaas:");
  console.log(unmatchedAsaas);
}

sync();
