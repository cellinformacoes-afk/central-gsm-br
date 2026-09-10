const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
let supabaseUrl = '';
let supabaseKey = '';

envLocal.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim();
});

async function check() {
  const url = `${supabaseUrl}/rest/v1/webhook_logs?source=eq.efibank_webhook&order=created_at.desc&limit=100`;
  const res = await fetch(url, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });
  const logs = await res.json();
  
  let issues = [];
  
  for (const log of logs) {
    const body = log.payload;
    if (body && body.pix && Array.isArray(body.pix)) {
      for (const p of body.pix) {
        const txid = p.txid;
        if (!txid) {
          issues.push({ time: log.created_at, error: 'Pix sem txid', valor: p.valor });
        } else {
          const txRes = await fetch(`${supabaseUrl}/rest/v1/transactions?external_id=eq.${txid}&select=id,status,user_id`, {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            }
          });
          const txs = await txRes.json();
          if (!txs || txs.length === 0) {
            issues.push({ time: log.created_at, error: 'TXID não encontrado', txid, valor: p.valor });
          }
        }
      }
    }
  }
  console.log(JSON.stringify(issues, null, 2));
}

check().catch(console.error);
