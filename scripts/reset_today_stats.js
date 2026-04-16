const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Carregar variáveis do .env do worker
dotenv.config({ path: path.join(__dirname, '../scripts/automation/.env') });

const supabaseUrl = 'https://cvzhczgvfvfflmcwmmvlh.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error("Erro: SUPABASE_SERVICE_ROLE_KEY não encontrada no .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetTodayStats() {
    console.log("Iniciando reset de entradas de hoje...");
    
    // Deletar transações de depósito de hoje
    const { data, error } = await supabase
        .from('transactions')
        .delete()
        .eq('type', 'deposit')
        .eq('status', 'success')
        .gte('created_at', new Date().toISOString().split('T')[0]);

    if (error) {
        console.error("Erro ao deletar transações:", error.message);
        process.exit(1);
    }

    console.log("Transações deletadas com sucesso. Entradas Hoje agora deve ser 0.");
}

resetTodayStats();
