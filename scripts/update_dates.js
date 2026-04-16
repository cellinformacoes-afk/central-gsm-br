const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const updates = {
  "centralgsm1920": "25 de junho de 2026, 20h28",
  "central028": "25 de junho de 2026, 21h30",
  "israeljackson": "16 de junho de 2026, 18h18",
  "gagajack": "24 de junho de 2026, 21h42",
  "jackgaga": "24 de junho de 2026, 21h44",
  "jackson20266": "7 de junho de 2026, 23h10",
  "jackson2026": "7 de junho de 2026, 18h16",
  "dudagaga645@gmail.com": "2026/08/06 23:13:36",
  "cursomdm5@gmail.com": "2026/08/11 02:13:00",
  "israelcandido2024@gmail.com": "2026/08/06 01:45:36",
  "cellinformacoes@gmail.com": "2027-03-11 16:12:08", // Note: TFM TOOL and KG TOOL PRO use this! We'll handle it carefully.
  "israelj": "15 de junho de 2026, 18h14",
  "jackson202666": "6 de junho de 2026, 18h18",
  "candidoisrael320@gmail.com": "27/07/2026 19:06:37",
  "desbloqueioscelulares38@gmail.com": "29/03/2026 02:07:50",
  "25187164": "14/06/2026 08:00",
  "eduardabypass@gmail.com": "2027-04-09 01:00:09"
};

// KG TOOL PRO uses same email as TFM TOOL, we'll try to find both.
// UNLOCK TOOL uses 'cellinformacoes@gmail.com' for TFM tool, but KG TOOL PRO uses "15/05/2026 00:00:00"

async function runUpdates() {
  const { data: accounts, error } = await supabase.from('service_accounts').select('id, credentials, services(title)');
  if (error) {
    console.error("Error fetching:", error);
    return;
  }

  let updatedCount = 0;
  for (const acc of accounts) {
    const creds = acc.credentials;
    if (!creds || !creds.email) continue;
    
    let dateToSet = updates[creds.email];
    const serviceName = (acc.services?.title || '').toLowerCase();
    
    if (creds.email === 'cellinformacoes@gmail.com') {
      if (serviceName.includes('kg tool')) {
        dateToSet = '15/05/2026 00:00:00';
      } else {
        dateToSet = '2027-03-11 16:12:08'; // TFM
      }
    }

    if (dateToSet) {
      const newCreds = { ...creds, expires_at: dateToSet };
      const { error: updErr } = await supabase.from('service_accounts').update({ credentials: newCreds }).eq('id', acc.id);
      if (updErr) {
        console.error("Error updating", creds.email, updErr);
      } else {
        console.log(`Updated ${creds.email} in ${serviceName} -> ${dateToSet}`);
        updatedCount++;
      }
    }
  }
  console.log("Done updating", updatedCount, "accounts.");
}

runUpdates();
