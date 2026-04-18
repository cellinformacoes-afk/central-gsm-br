const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cvzhczgvfvflmcwmmvlh.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2emhjemd2ZnZmbG1jd21tdmxoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzcxMzIzNSwiZXhwIjoyMDg5Mjg5MjM1fQ.ZjWHhsx09d52PaCuhFjrHYm790te5yHhq_X3XWnsysY';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkDeposits() {
  const email = 'ericansdiogo@gmail.com';
  console.log(`Buscando usuario: ${email}`);
  
  // Buscar no profiles (geralmente tem e-mail lá também no sistema do cliente)
  let { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, balance')
    .eq('email', email)
    .single();

  if (!profile) {
    // Tenta buscar no auth.users via admin
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === email);
    if (user) {
        profile = { id: user.id, email: user.email };
    }
  }

  if (!profile) {
    console.log('Usuario não encontrado.');
    return;
  }

  console.log(`Usuario encontrado: ${profile.id}`);

  // Pegar data de hoje (considerando timezone zero ou do sistema)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const { data: txs, error: txError } = await supabase
    .from('transactions')
    .select('amount, created_at, status')
    .eq('user_id', profile.id)
    .eq('status', 'success')
    .gte('created_at', todayStart.toISOString())
    .lte('created_at', todayEnd.toISOString());

  if (txError) {
    console.error('Erro ao buscar transacoes:', txError);
    return;
  }

  const total = txs.reduce((acc, tx) => acc + (tx.amount || 0), 0);
  console.log(`\nRESULTADO PARA ${email}:`);
  console.log(`Total de depositos hoje: R$ ${total.toFixed(2)}`);
  console.log(`Quantidade de transacoes: ${txs.length}`);
  console.log('Detalhes:', JSON.stringify(txs, null, 2));
}

checkDeposits();
