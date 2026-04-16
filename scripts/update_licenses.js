const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const updates = {
  "centralgsm1920": "2026-06-25T20:28:00-03:00",
  "central028": "2026-06-25T21:30:00-03:00",
  "israeljackson": "2026-06-16T18:18:00-03:00",
  "gagajack": "2026-06-24T21:42:00-03:00",
  "jackgaga": "2026-06-24T21:44:00-03:00",
  "jackson20266": "2026-06-07T23:10:00-03:00",
  "jackson2026": "2026-06-07T18:16:00-03:00",
  "dudagaga645@gmail.com": "2026-08-06T23:13:36-03:00",
  "cursomdm5@gmail.com": "2026-08-11T02:13:00-03:00",
  "israelcandido2024@gmail.com": "2026-08-06T01:45:36-03:00",
  "cellinformacoes@gmail.com": "2027-03-11T16:12:08-03:00",
  "israelj": "2026-06-15T18:14:00-03:00",
  "jackson202666": "2026-06-06T18:18:00-03:00",
  "candidoisrael320@gmail.com": "2026-07-27T19:06:37-03:00",
  "desbloqueioscelulares38@gmail.com": "2026-03-29T02:07:50-03:00",
  "25187164": "2026-06-14T08:00:00-03:00",
  "eduardabypass@gmail.com": "2027-04-09T01:00:09-03:00"
};

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
        dateToSet = '2026-05-15T00:00:00-03:00';
      } else {
        dateToSet = '2027-03-11T16:12:08-03:00'; // TFM
      }
    }

    if (dateToSet) {
      // Remover expires_at que pus no jsonb por acidente
      if (creds.expires_at) delete creds.expires_at;

      // Update the col license_expires_at AND remove expires_at from credentials
      const { error: updErr } = await supabase.from('service_accounts').update({ 
         license_expires_at: dateToSet,
         credentials: creds
      }).eq('id', acc.id);
      
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
