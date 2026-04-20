const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function listProfilesAndDuplicates() {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, cpf')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }

  console.log('--- Last 10 profiles ---');
  console.log(JSON.stringify(profiles.slice(0, 10), null, 2));

  const cpfCounts = {};
  profiles.forEach(p => {
    if (p.cpf) {
      cpfCounts[p.cpf] = (cpfCounts[p.cpf] || 0) + 1;
    }
  });

  const duplicates = Object.keys(cpfCounts).filter(cpf => cpfCounts[cpf] > 1);
  if (duplicates.length > 0) {
    console.log('\n--- DUPLICATE CPFs FOUND ---');
    duplicates.forEach(cpf => {
      console.log(`CPF: ${cpf}, Count: ${cpfCounts[cpf]}`);
      console.log('Emails:', profiles.filter(p => p.cpf === cpf).map(p => p.email).join(', '));
    });
  } else {
    console.log('\nNo duplicate CPFs found in the current profiles list.');
  }
}

listProfilesAndDuplicates();
