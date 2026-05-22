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

const userId = 'b437c5ef-685c-43ef-b0dd-d1e6f954d4c7';

// Transações pendentes da Alana hoje
const pendingTxs = [
  { id: '7281fa70-9b3f-4519-997a-298dd829d469', amount: 15, label: 'R$15 - 13:03' },
  { id: '7cf46803-e564-46a8-b4f6-98c285c1eceb', amount: 14, label: 'R$14 - 13:07' },
];

async function creditAll() {
  let totalCredited = 0;

  for (const tx of pendingTxs) {
    console.log(`\n--- Processando transação ${tx.label} ---`);

    // Tenta marcar como success SOMENTE se ainda estiver pending (evita duplo crédito)
    const { data: updatedTx, error: txError } = await supabase
      .from('transactions')
      .update({ status: 'success', description: 'Creditado Manualmente (Suporte)' })
      .eq('id', tx.id)
      .eq('status', 'pending')
      .select();

    if (txError) {
      console.error('Erro ao atualizar transação:', txError);
      continue;
    }

    if (!updatedTx || updatedTx.length === 0) {
      console.log('⚠️  Transação não estava pending ou não encontrada. Pulando para evitar duplo crédito.');
      continue;
    }

    console.log('✅ Transação marcada como success:', updatedTx[0].id);
    totalCredited += tx.amount;
  }

  if (totalCredited === 0) {
    console.log('\n⚠️  Nenhum valor creditado (transações já processadas ou não encontradas).');
    return;
  }

  // Busca saldo atual
  const { data: profile, error: pError } = await supabase
    .from('profiles')
    .select('balance')
    .eq('id', userId)
    .single();

  if (pError || !profile) {
    console.error('Erro ao buscar perfil:', pError);
    return;
  }

  const oldBalance = profile.balance || 0;
  const newBalance = oldBalance + totalCredited;

  // Atualiza saldo
  const { data: updatedProfile, error: updateError } = await supabase
    .from('profiles')
    .update({ balance: newBalance })
    .eq('id', userId)
    .select();

  if (updateError) {
    console.error('Erro ao atualizar saldo:', updateError);
    return;
  }

  console.log(`\n🎉 Saldo atualizado com sucesso!`);
  console.log(`   Saldo anterior: R$${oldBalance.toFixed(2)}`);
  console.log(`   Total creditado: R$${totalCredited.toFixed(2)}`);
  console.log(`   Novo saldo: R$${updatedProfile[0].balance.toFixed(2)}`);
}

creditAll();
