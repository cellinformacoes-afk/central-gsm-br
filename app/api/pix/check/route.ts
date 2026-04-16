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
