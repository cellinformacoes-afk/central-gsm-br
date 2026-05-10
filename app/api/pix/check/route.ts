import { NextResponse } from 'next/server';
import { asaas } from '@/lib/asaas';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!paymentId || !userId) {
      return NextResponse.json({ error: 'ID do pagamento ou do usuário faltando' }, { status: 400 });
    }

    // --- NOVA LÓGICA PARA PIX ESTÁTICO ---
    if (paymentId.startsWith('STATIC_')) {
      // 1. Buscar a transação pendente no banco (com data de criação)
      const { data: tx } = await supabaseAdmin
        .from('transactions')
        .select('*')
        .eq('external_id', paymentId)
        .single();

      if (!tx) {
        return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 });
      }

      if (tx.status === 'success') {
        return NextResponse.json({ status: 'approved', amount: tx.amount });
      }

      const expectedAmount = parseFloat(tx.amount);
      const createdAt = new Date(tx.created_at);

      // 2. Consultar Extrato do Asaas
      const asaasUrl = process.env.ASAAS_API_URL || 'https://api.asaas.com/v3';
      const asaasKey = process.env.ASAAS_API_KEY || '';

      const asaasRes = await fetch(`${asaasUrl}/pix/transactions?limit=50`, {
        headers: { 'access_token': asaasKey.trim() }
      });

      let asaasData = await asaasRes.json();
      let transactions = asaasData.data || [];

      if (transactions.length === 0) {
         const finRes = await fetch(`${asaasUrl}/financialTransactions?limit=50`, {
           headers: { 'access_token': asaasKey.trim() }
         });
         const finData = await finRes.json();
         transactions = finData.data || [];
      }

      // Buscar IDs já usados para evitar duplo crédito
      const { data: usedTxs } = await supabaseAdmin
        .from('transactions')
        .select('description')
        .not('description', 'is', null)
        .order('created_at', { ascending: false })
        .limit(200);
      
      const usedAsaasIds = usedTxs?.map(tx => tx.description) || [];

      const payerName = paymentId.split('_').slice(2).join(' ').replace(/_/g, ' ').toUpperCase();

      // 3. Coletar todos os candidatos por valor + tempo
      const candidates: any[] = [];

      for (const t of transactions) {
        if (usedAsaasIds.includes(t.id)) continue;

        const tValue = Math.abs(parseFloat(t.value || '0'));
        const valueMatches = Math.abs(tValue - expectedAmount) < 0.02;

        const tDate = new Date(t.date || t.effectiveDate || t.created_at || 0);
        const isRecent = tDate >= createdAt;

        if (valueMatches && isRecent) {
          candidates.push(t);
        }
      }

      // 4. Escolher o melhor candidato
      let matched = null;

      if (candidates.length === 1) {
        // Apenas um candidato — aprova direto
        matched = candidates[0];
      } else if (candidates.length > 1 && payerName) {
        // Mais de um candidato — usa nome como desempate
        const nameParts = payerName.split(' ').filter((p: string) => p.length > 2);
        matched = candidates.find(t => {
          const tName = (t.payer?.name || t.description || '').toUpperCase();
          return nameParts.some((part: string) => tName.includes(part));
        }) || candidates[0]; // se nenhum bateu o nome, pega o primeiro mesmo
      }

      // 5. Se achou, aprova
      if (matched) {
        console.log("Match encontrado! Aprovando...", matched.id);
        const { error: updateTxError } = await supabaseAdmin
          .from('transactions')
          .update({ 
            status: 'success',
            description: matched.id
          })
          .eq('external_id', paymentId);
          
        if (updateTxError) throw updateTxError;

        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('balance')
          .eq('id', userId)
          .single();
          
        const newBalance = (profile?.balance || 0) + expectedAmount;

        const { error: updateProfileError } = await supabaseAdmin
          .from('profiles')
          .update({ balance: newBalance })
          .eq('id', userId);
          
        if (updateProfileError) throw updateProfileError;

        return NextResponse.json({ 
          status: 'approved', 
          amount: expectedAmount, 
          newBalance: newBalance 
        });
      }

      return NextResponse.json({ status: 'pending' });
    }
    // --- FIM LOGICA ESTÁTICA ---

    let status = await asaas.getPaymentStatus(paymentId);
    // Se o pagamento atual estiver pendente, não fazemos mais fallback global
    // O webhook cuidará de atualizar o saldo se outros pagamentos forem confirmados.
    // Manter a verificação estritamente para o paymentId solicitado para evitar confusão no frontend.


    // Debug Log
    await supabaseAdmin.from('webhook_logs').insert({
      payload: { 
        source: 'check_route_asaas', 
        paymentId: paymentId, 
        originalId: paymentId,
        status: status
      },
      created_at: new Date().toISOString()
    });

    if (status === 'approved') {
      // In Asaas, we might need the amount if it's not passed, but usually it's better to fetch it
      const response = await fetch(`${process.env.ASAAS_API_URL || 'https://api.asaas.com/v3'}/payments/${paymentId}`, {
        headers: {
          'access_token': (process.env.ASAAS_API_KEY || '').trim(),
          'Content-Type': 'application/json'
        }
      });
      const paymentData = await response.json();
      console.log('Dados do pagamento aprovado:', paymentData);
      const amount = parseFloat(String(paymentData.value || '0'));

      // 1. Call RPC for atomic update
      const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('handle_payment_success', {
        p_user_id: userId,
        p_amount: amount,
        p_payment_id: paymentId
      });

      if (rpcError) {
        await supabaseAdmin.from('webhook_logs').insert({
          payload: { 
            source: 'check_route_error_asaas', 
            step: 'rpc_call',
            paymentId, 
            userId,
            error: rpcError 
          }
        });
        throw rpcError;
      }

      if (rpcResult.status === 'already_processed') {
        return NextResponse.json({ status: 'already_processed', balance: null });
      }

      // Debug Log Success
      await supabaseAdmin.from('webhook_logs').insert({
        payload: { 
          source: 'check_route_success_asaas', 
          paymentId, 
          userId,
          amount,
          previousBalance: rpcResult.oldBalance,
          newBalance: rpcResult.newBalance 
        }
      });

      return NextResponse.json({ 
        status: 'approved', 
        amount, 
        newBalance: rpcResult.newBalance 
      });
    }

    return NextResponse.json({ status: status });
  } catch (error: any) {
    console.error('Erro ao verificar pagamento no Asaas:', error);
    await supabaseAdmin.from('webhook_logs').insert({
      payload: { 
        source: 'check_route_error_asaas', 
        paymentId: new URL(request.url).searchParams.get('id'),
        error: error.message,
        stack: error.stack
      }
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
