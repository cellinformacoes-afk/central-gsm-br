import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!paymentId || !userId) {
      return NextResponse.json({ error: 'ID do pagamento ou do usuário faltando' }, { status: 400 });
    }

    let accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;
    if (accessToken) accessToken = accessToken.trim();
    
    const client = new MercadoPagoConfig({ accessToken: accessToken! });
    const payment = new Payment(client);

    const paymentData = await payment.get({ id: paymentId });

    // Debug Log
    await supabase.from('webhook_logs').insert({
      payload: { 
        source: 'check_route', 
        paymentId, 
        status: paymentData.status,
        full_data: paymentData 
      },
      created_at: new Date().toISOString()
    });

    if (paymentData.status === 'approved') {
      const amount = parseFloat(String(paymentData.transaction_amount || '0'));

      // 1. Call RPC for atomic update
      const { data: rpcResult, error: rpcError } = await supabase.rpc('handle_payment_success', {
        p_user_id: userId,
        p_amount: amount,
        p_payment_id: paymentId
      });

      if (rpcError) {
        await supabase.from('webhook_logs').insert({
          payload: { 
            source: 'check_route_error', 
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
      await supabase.from('webhook_logs').insert({
        payload: { 
          source: 'check_route_success', 
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

    return NextResponse.json({ status: paymentData.status });
  } catch (error: any) {
    console.error('Erro ao verificar pagamento:', error);
    await supabase.from('webhook_logs').insert({
      payload: { 
        source: 'check_route_error', 
        paymentId: new URL(request.url).searchParams.get('id'),
        error: error.message,
        stack: error.stack
      }
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
