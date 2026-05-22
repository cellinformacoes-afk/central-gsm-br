require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function removeTestTransaction() {
  const { data, error } = await supabase
    .from('transactions')
    .delete()
    .eq('amount', 300)
    .eq('description', 'Creditado manualmente via script (300 reais)')
    .select();

  if (error) {
    console.error("Erro ao remover:", error);
  } else {
    console.log("Transação de 300 reais removida com sucesso. O seu painel deve voltar ao valor normal!");
    console.log(data);
  }
}

removeTestTransaction();
