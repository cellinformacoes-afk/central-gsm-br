const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function deleteUser() {
  const email = 'shyyxn9@gmail.com';

  const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('email', email).single();
  
  if (!profile) {
    console.log("Not found in profiles.");
    return;
  }

  const { data, error } = await supabaseAdmin.auth.admin.deleteUser(profile.id);
  if (error) {
     console.error("Error deleting from auth:", error);
  } else {
     console.log("Successfully deleted user from authentication system:", data);
  }
}

deleteUser();
