require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPix() {
  const email = 'thiagopl730@gmail.com';
  
  // Try fetching pix payments for this user or broadly
  const { data: pix, error: pixError } = await supabase
    .from('pix_transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (pixError) {
    console.log("Error fetching pix_transactions:", pixError.message);
  } else {
    console.log("Recent pix transactions:", pix);
  }
}

checkPix();
