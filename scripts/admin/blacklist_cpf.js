const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function blacklistCpf(rawCpf, reason = 'Banido por administração') {
  const cpf = rawCpf.replace(/\D/g, "");
  
  if (!cpf || cpf.length < 11) {
    console.error('CPF inválido fornecido.');
    return;
  }

  console.log(`--- Iniciando banimento do CPF: ${cpf} ---`);

  // 1. Check/Create the blacklist table (limited without execute_sql, but we can attempt to insert)
  // 2. Identify and Delete users
  const { data: users, error: fetchError } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('cpf', cpf);

  if (fetchError) {
    console.error('Erro ao buscar usuários:', fetchError);
    return;
  }

  if (users && users.length > 0) {
    console.log(`Encontrados ${users.length} usuários. Excluindo contas...`);
    for (const user of users) {
      const { error: delAuthError } = await supabase.auth.admin.deleteUser(user.id);
      if (delAuthError) {
        console.error(`Erro ao excluir Auth Usuário ${user.email}:`, delAuthError);
      } else {
        console.log(`Conta excluída: ${user.email}`);
        // Profile is auto-deleted OR we manual delete
        await supabase.from('profiles').delete().eq('id', user.id);
      }
    }
  } else {
    console.log('Nenhum usuário ativo encontrado com este CPF.');
  }

  // 3. Add to blacklist table
  console.log('Adicionando à lista negra (blacklist)...');
  const { error: blacklistError } = await supabase
    .from('cpf_blacklist')
    .upsert({ cpf, reason }, { onConflict: 'cpf' });

  if (blacklistError) {
    if (blacklistError.code === '42P01') {
      console.error('ERRO: A tabela "cpf_blacklist" ainda não existe no seu banco de dados.');
      console.error('Por favor, execute o comando SQL que eu te mandei no painel do Supabase primeiro.');
    } else {
      console.error('Erro ao adicionar na blacklist:', blacklistError);
    }
  } else {
    console.log(`CPF ${cpf} bloqueado com sucesso!`);
  }
}

const targetCpf = process.argv[2];
const reason = process.argv[3];

if (!targetCpf) {
  console.error('Uso: node scripts/admin/blacklist_cpf.js <CPF> [motivo]');
} else {
  blacklistCpf(targetCpf, reason);
}
