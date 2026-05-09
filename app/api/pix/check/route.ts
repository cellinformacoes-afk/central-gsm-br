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
      // 1. Buscar a transação pendente no banco
      const { data: tx } = await supabaseAdmin
        .from('transactions')
        .select('*')
        .eq('external_id', paymentId)
        .single();

      if (!tx) {
        return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 });
      }

      if (tx.status === 'success') {
        return NextResponse.json({ status: 'approved' });
      }

      const expectedAmount = parseFloat(tx.amount);
      // O nome agora vem dentro do próprio paymentId (ex: STATIC_123456_NOME_DA_PESSOA)
      const nameParts = paymentId.split('_').slice(2);
      const payerName = nameParts.join(' ').toUpperCase();

      // 2. Consultar Extrato do Asaas (Últimas transações financeárias)
      const asaasUrl = process.env.ASAAS_API_URL || 'https://api.asaas.com/v3';
      const asaasKey = process.env.ASAAS_API_KEY || '';

      // Buscando transações de recebimento recentes
      const asaasRes = await fetch(`${asaasUrl}/pix/transactions?status=DONE&type=CREDIT&limit=20`, {
        headers: { 'access_token': asaasKey.trim() }
      });

      if (!asaasRes.ok) {
        // Fallback para extrato financeiro se o de cima falhar dependendo da permissão
        console.log("Fallback para extrato financeiro...");
      }

      const asaasData = await asaasRes.json();
      const transactions = asaasData.data || [];

      // 3. Procurar match de Valor e Nome
      let foundMatch = false;
      for (const t of transactions) {
        // Tenta achar pelo nome do pagador e valor
        const tValue = parseFloat(t.value);
        const tName = (t.endToEndIdentifier || t.description || t.payer?.name || '').toUpperCase();

        if (tValue === expectedAmount && payerName && tName.includes(payerName.split(' ')[0])) {
          foundMatch = true;
          break;
        }
      }

      // 4. Se achou, aprova
      if (foundMatch) {
        const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('handle_payment_success', {
          p_user_id: userId,
          p_amount: expectedAmount,
          p_payment_id: paymentId
        });

        if (rpcError) throw rpcError;

        return NextResponse.json({ 
          status: 'approved', 
          amount: expectedAmount, 
          newBalance: rpcResult.newBalance 
        });
      }

      // Se não achou ainda
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
