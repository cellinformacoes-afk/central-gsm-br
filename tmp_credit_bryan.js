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

const userId = 'f28b0015-32ee-4610-bf94-007162aa42fc';
const txId   = '43cc98b8-6e7b-4206-b4b9-5c7c36760592';
const amount = 12;

async function credit() {
  console.log('=== CRÉDITO - bryandeaths156@gmail.com ===\n');

  // Marca como success SOMENTE se ainda estiver pending
  const { data: updatedTx, error: txError } = await supabase
    .from('transactions')
    .update({ status: 'success', description: 'Creditado Manualmente (Suporte)' })
    .eq('id', txId)
    .eq('status', 'pending')
    .select();

  if (txError) {
    console.error('Erro ao atualizar transação:', txError);
    return;
  }
  if (!updatedTx || updatedTx.length === 0) {
    console.log('⚠️  Transação não estava pending. Nenhum crédito aplicado (prevenção de duplo crédito).');
    return;
  }
  console.log('✅ Transação marcada como success:', updatedTx[0].id);

  // Busca saldo atual
  const { data: profile } = await supabase.from('profiles').select('balance').eq('id', userId).single();
  const oldBalance = profile?.balance || 0;
  const newBalance = oldBalance + amount;

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

  console.log('\n🎉 Saldo creditado com sucesso!');
  console.log(`   Saldo anterior: R$${oldBalance.toFixed(2)}`);
  console.log(`   Creditado: R$${amount.toFixed(2)}`);
  console.log(`   Novo saldo: R$${updatedProfile[0].balance.toFixed(2)}`);
}

credit();
