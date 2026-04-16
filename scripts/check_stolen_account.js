const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data: rentals } = await supabase.from('rentals').select('*').eq('order_id', '370fc95c-b900-48d4-a805-8979fd24ce6e');
  console.log(rentals);
}
check();
