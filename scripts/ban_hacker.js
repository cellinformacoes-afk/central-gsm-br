const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function banHacker() {
  const email = 'shyyxn9@gmail.com';

  const { data: profile } = await supabase.from('profiles').select('id, balance').eq('email', email).single();
  
  if (!profile) {
    console.log("Not found.");
    return;
  }

  // Zera o saldo e altera a role
  const { error } = await supabase.from('profiles').update({ balance: 0.00, role: 'banned' }).eq('id', profile.id);
  if (error) console.log(error);
  
  // Opcional: Cancelar os pedidos dele pra que as licenças dele parem de valer!
  const { data: orders } = await supabase.from('orders').select('id').eq('user_id', profile.id);
  if (orders) {
     for (const o of orders) {
       await supabase.from('orders').update({ status: 'Cancelado (Fraude)' }).eq('id', o.id);
     }
  }

  console.log(`Sucesso!! Saldo de ${profile.balance} zerado, usuário banido e ${orders?.length || 0} compras canceladas.`);
}

banHacker();
