import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Log the webhook call
    await supabaseAdmin.from('webhook_logs').insert({
      payload: body,
      source: 'efibank_webhook',
      created_at: new Date().toISOString()
    });

    // O payload do webhook da Efí Bank (Gerencianet) para Pix vem como um array 'pix'
    if (body.pix && Array.isArray(body.pix)) {
      for (const p of body.pix) {
        try {
          const txid = p.txid; // ID externo salvo no banco
          const amount = parseFloat(p.valor);
          const endToEndId = p.endToEndId;
          
          console.log(`Processando pagamento recebido EFI: txid=${txid} valor=${amount}`);

          let txToProcess = null;

          if (txid) {
            // Busca a transação pelo ID
            const { data: foundTx, error: txError } = await supabaseAdmin
              .from('transactions')
              .select('*')
              .eq('external_id', txid)
              .single();

            if (!txError && foundTx) {
              txToProcess = foundTx;
            } else {
              console.error('Transação não encontrada no banco pelo txid:', txid);
            }
          }

          // Se não encontrou pelo txid (ou se veio sem txid), tenta buscar pelo valor exato
          if (!txToProcess) {
            console.warn(`Tentando buscar transação pendente pelo valor exato: R$ ${amount}`);
            
            const { data: pendingTxs } = await supabaseAdmin
              .from('transactions')
              .select('*')
              .eq('status', 'pending')
              .eq('type', 'pix')
              .order('created_at', { ascending: false })
              .limit(50);

            const candidates = (pendingTxs || []).filter((t: any) =>
              Math.abs(parseFloat(String(t.amount)) - amount) < 0.05
            );

            if (candidates.length > 0) {
              txToProcess = candidates[0]; // Pega a mais recente
              console.log(`✅ Sucesso: Transação correspondente encontrada pelo valor! User ID: ${txToProcess.user_id}`);
            } else {
              console.error('Nenhuma transação pendente encontrada para o valor:', amount);
              continue; // Pula para o próximo pix se não encontrar nenhuma
            }
          }

          const tx = txToProcess;

          if (tx.status === 'success' || tx.status === 'approved') {
            console.log(`Pagamento ${txid} já processado anteriormente.`);
            continue;
          }

          // Atualiza a transação como sucesso
          await supabaseAdmin.from('transactions').update({ 
            status: 'success', 
            description: endToEndId // Salva o endToEndId como comprovante
          }).eq('id', tx.id);

          // Adiciona saldo ao usuário
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('balance')
            .eq('id', tx.user_id)
            .single();

          const newBalance = (profile?.balance || 0) + tx.amount;

          await supabaseAdmin.from('profiles').update({ balance: newBalance }).eq('id', tx.user_id);

          console.log(`✅ PIX Efí Bank creditado: R$ ${tx.amount} para user ${tx.user_id}. Novo saldo: ${newBalance}`);
        } catch (innerError) {
          console.error(`Erro ao processar item do PIX:`, p, innerError);
        }
      }
    }

    // A API da Efí Bank exige que retorne HTTP 200 rapidamente
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Erro no Webhook da Efí Bank:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
