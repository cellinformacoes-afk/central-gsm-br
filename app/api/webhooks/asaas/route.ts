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
      const paymentId = payment.id;

      // BARRAGEM DE SEGURANÇA (ANTI-FRAUDE)
      // O site não confia mais no payload que chegou. Ele vai no Asaas checar se o Pix realmente existe.
      const asaasResponse = await fetch(`${process.env.ASAAS_API_URL || 'https://api.asaas.com/v3'}/payments/${paymentId}`, {
        headers: {
          'access_token': (process.env.ASAAS_API_KEY || '').trim(),
          'Content-Type': 'application/json'
        }
      });

      if (!asaasResponse.ok) {
         console.error('Anti-fraude: Pagamento não encontrado no Asaas oficial.');
         return NextResponse.json({ error: 'Pagamento não encontrado no sistema' }, { status: 400 });
      }

      const verifiedPayment = await asaasResponse.json();

      if (verifiedPayment.status !== 'RECEIVED' && verifiedPayment.status !== 'CONFIRMED') {
         console.error('Anti-fraude: Tentativa de forçar status, o status real é:', verifiedPayment.status);
         return NextResponse.json({ error: 'O pagamento real não consta como pago' }, { status: 400 });
      }

      // EXTRAIR VALOR ÚNICA E EXCLUSIVAMENTE DA RESPOSTA OFICIAL DO ASAAS
      const amount = parseFloat(String(verifiedPayment.netValue || verifiedPayment.value || '0'));
      const userId = verifiedPayment.externalReference;

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
