const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function countAccountsByCPF() {
  const cpf = '60458740306';
  const { data, error } = await supabase
    .from('profiles')
    .select('email, balance')
    .eq('cpf', cpf);

  if (error) {
    console.error('Error fetching accounts:', error);
  } else {
    console.log('Accounts Found:', JSON.stringify(data, null, 2));
    console.log(`Total Count: ${data.length}`);
  }
}

countAccountsByCPF();
