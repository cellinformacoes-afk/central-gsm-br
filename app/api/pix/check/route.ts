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
    let finalPaymentId = paymentId;

    // Se o pagamento atual estiver pendente, vamos ver se o usuário tem algum outro que já foi pago
    // Isso resolve o problema de gerar 2 QR codes e pagar o primeiro
    if (status !== 'approved') {
      const userPayments = await asaas.listUserPayments(userId);
      
      for (const payment of userPayments) {
        if (payment.status === 'RECEIVED' || payment.status === 'CONFIRMED') {
          // Verificar se esse ID de pagamento já foi creditado no banco
          const { data: existingTx } = await supabaseAdmin
            .from('transactions')
            .select('id')
            .eq('external_id', payment.id)
            .maybeSingle();

          if (!existingTx) {
            status = 'approved';
            finalPaymentId = payment.id;
            console.log('Detectado NOVO pagamento confirmado para o usuário:', finalPaymentId);
            break; // Encontramos um pagamento válido e não processado
          }
        }
      }
    }

    // Debug Log
    await supabaseAdmin.from('webhook_logs').insert({
      payload: { 
        source: 'check_route_asaas', 
        paymentId: finalPaymentId, 
        originalId: paymentId,
        status: status
      },
      created_at: new Date().toISOString()
    });

    if (status === 'approved') {
      // In Asaas, we might need the amount if it's not passed, but usually it's better to fetch it
      const response = await fetch(`${process.env.ASAAS_API_URL || 'https://api.asaas.com/v3'}/payments/${finalPaymentId}`, {
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
        p_payment_id: finalPaymentId
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
