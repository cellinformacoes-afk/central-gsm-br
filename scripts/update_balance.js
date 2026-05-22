const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cvzhczgvfvflmcwmmvlh.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2emhjemd2ZnZmbG1jd21tdmxoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzcxMzIzNSwiZXhwIjoyMDg5Mjg5MjM1fQ.ZjWHhsx09d52PaCuhFjrHYm790te5yHhq_X3XWnsysY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const email = 'robertinhoda300@gmail.com';
const amountToAdd = 1.00;

async function updateBalance() {
    console.log(`Buscando usuário: ${email}`);
    
    const { data: profile, error: fError } = await supabase
        .from('profiles')
        .select('id, balance, email')
        .eq('email', email)
        .single();

    if (fError || !profile) {
        console.error('Usuário não encontrado:', fError?.message);
        return;
    }

    const oldBalance = parseFloat(profile.balance || 0);
    const newBalance = oldBalance + amountToAdd;

    console.log(`ID: ${profile.id} | Saldo antigo: ${oldBalance} | Novo saldo: ${newBalance}`);

    const { error: uError } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', profile.id);

    if (uError) {
        console.error('Erro ao atualizar saldo:', uError.message);
        return;
    }

    const { error: tError } = await supabase
        .from('transactions')
        .insert([{
            user_id: profile.id,
            amount: amountToAdd,
            type: 'deposit',
            status: 'success',
            description: 'Ajuste de saldo manual (Admin)'
        }]);

    if (tError) {
        console.error('Erro ao registrar transação:', tError.message);
    } else {
        console.log('Saldo de R$ 1,00 adicionado com sucesso!');
    }
}

updateBalance();
