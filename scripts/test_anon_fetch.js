const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFetch() {
  const { data: catData, error: catError } = await supabase.from('categories').select('*');
  console.log("Categories:", catData?.length, "Error:", catError);

  const { data: servData, error: servError } = await supabase
      .from('services')
      .select('*, categories(name, slug)')
      .eq('active', true);
  console.log("Services:", servData?.length, "Error:", servError);
}

testFetch();
