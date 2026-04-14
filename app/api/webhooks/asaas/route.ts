import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const event = body.event;
    const payment = body.payment;

    // Log the webhook call
    await supabaseAdmin.from('webhook_logs').insert({
      payload: body,
      source: 'asaas_webhook',
      created_at: new Date().toISOString()
    });

    // We only care about success events
    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      const userId = payment.externalReference;
      const amount = payment.value;
      const paymentId = payment.id;

      if (!userId) {
        console.error('UserId missing in Asaas payment externalReference:', paymentId);
        return NextResponse.json({ error: 'externalReference missing' });
      }

      console.log('Asaas processing webhook success:', { userId, amount, paymentId });

      // Call the atomic balance update RPC
      const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('handle_payment_success', {
        p_user_id: userId,
        p_amount: amount,
        p_payment_id: paymentId
      });

      if (rpcError) {
        console.error('Error calling handle_payment_success from Asaas webhook:', rpcError);
        return NextResponse.json({ error: rpcError.message }, { status: 500 });
      }

      console.log('Asaas webhook RPC result:', rpcResult);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Erro no Webhook do Asaas:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
