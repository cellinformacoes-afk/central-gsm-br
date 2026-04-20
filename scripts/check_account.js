const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkAccountInfo() {
  const email = 'ericansdiogo@gmail.com';
  const { data, error } = await supabase
    .from('profiles')
    .select('email, balance, cpf')
    .eq('email', email)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      console.log(`Account with email ${email} not found.`);
    } else {
      console.error('Error fetching account info:', error);
    }
  } else {
    console.log('Account Info:', JSON.stringify(data, null, 2));
  }
}

checkAccountInfo();
