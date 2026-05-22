const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length > 0) {
        env[key.trim()] = rest.join('=').trim().replace(/'/g, '').replace(/"/g, '');
    }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: users, error: authError } = await supabase.auth.admin.listUsers();
  const user = users?.users?.find(u => u.email === 'bryandeaths156@gmail.com');

  if (!user) {
    console.log('❌ Usuário não encontrado no auth.');
    return;
  }
  console.log('✅ Usuário encontrado:', user.id, user.email);

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  console.log('💰 Saldo atual:', profile?.balance ?? 'N/A');

  // Busca transações de hoje
  const { data: txsHoje } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', '2026-05-14T00:00:00Z')
    .order('created_at', { ascending: false });

  console.log('\n📋 Transações de HOJE:', txsHoje?.length ? txsHoje : 'Nenhuma encontrada');

  // Busca todas as transações recentes (últimos 3 dias)
  const { data: txsRecentes } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', '2026-05-12T00:00:00Z')
    .order('created_at', { ascending: false });

  if (!txsHoje?.length) {
    console.log('\n📋 Transações recentes (3 dias):', txsRecentes?.length ? txsRecentes : 'Nenhuma encontrada');
  }
}

check();
