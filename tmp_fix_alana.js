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

// IDs das transações que foram marcadas como success indevidamente
const TX_15 = '7281fa70-9b3f-4519-997a-298dd829d469'; // R$15 - possivelmente errada
const TX_14 = '7cf46803-e564-46a8-b4f6-98c285c1eceb'; // R$14 - não foi paga

const VALOR_CORRETO = 16;

async function fix() {
  console.log('=== CORREÇÃO DE SALDO - alanapenedo2020@gmail.com ===\n');

  // 1. Reverter transação de R$14 para 'cancelled' (não foi paga)
  const { data: revertedTx, error: revertError } = await supabase
    .from('transactions')
    .update({ status: 'cancelled', description: 'Cancelado - Comprovante não confere (Suporte)' })
    .eq('id', TX_14)
    .select();

  if (revertError) {
    console.error('Erro ao reverter transação R$14:', revertError);
    return;
  }
  console.log('✅ Transação R$14 revertida para cancelled:', TX_14);

  // 2. Ajustar transação R$15 para reflectir o valor real de R$16 pago
  const { data: adjustedTx, error: adjustError } = await supabase
    .from('transactions')
    .update({ amount: 16, description: 'Creditado Manualmente (Suporte) - R$16 conforme comprovante' })
    .eq('id', TX_15)
    .select();

  if (adjustError) {
    console.error('Erro ao ajustar transação R$15:', adjustError);
    return;
  }
  console.log('✅ Transação ajustada para R$16:', adjustedTx[0]);

  // 3. Corrigir saldo para R$16
  const { data: updatedProfile, error: updateError } = await supabase
    .from('profiles')
    .update({ balance: VALOR_CORRETO })
    .eq('id', userId)
    .select();

  if (updateError) {
    console.error('Erro ao corrigir saldo:', updateError);
    return;
  }

  console.log('\n🎉 Correção concluída!');
  console.log(`   Saldo incorreto anterior: R$29.00`);
  console.log(`   Novo saldo correto: R$${updatedProfile[0].balance.toFixed(2)}`);
  console.log(`   Transação R$14 (${TX_14}): cancelada`);
  console.log(`   Transação ajustada para R$16 (${TX_15}): success`);
}

fix();
