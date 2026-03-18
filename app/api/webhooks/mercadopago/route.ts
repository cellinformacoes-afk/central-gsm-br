import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
       return NextResponse.json({ error: 'Token não encontrado no servidor' }, { status: 500 });
    }

    const client = new MercadoPagoConfig({ 
      accessToken: accessToken 
    });
    const { searchParams } = new URL(request.url);
    const bodyJson = await request.json().catch(() => ({}));
    const headersObj = Object.fromEntries(request.headers.entries());

    // Debug Log to Supabase
    await supabase.from('webhook_logs').insert({
      payload: bodyJson,
      headers: headersObj,
      created_at: new Date().toISOString()
    });

    const id = searchParams.get('data.id') || searchParams.get('id') || bodyJson.data?.id || bodyJson.id;
    const type = searchParams.get('type') || bodyJson.type || searchParams.get('topic');

    console.log('Webhook MP recebido:', { id, type, body: bodyJson, params: Object.fromEntries(searchParams) });

    if (type === 'payment' && id) {
      const payment = new Payment(client);
      const paymentData = await payment.get({ id });

      if (paymentData.status === 'approved') {
        const userId = paymentData.metadata.user_id;
        const amount = parseFloat(String(paymentData.transaction_amount || '0'));

        console.log('Processando pagamento aprovado:', { userId, amount });

        // 1. Get current balance (gracefully)
        const { data: profile } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', userId)
          .maybeSingle();

        const newBalance = (profile?.balance || 0) + amount;

        // 2. Update or Create profile
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({ 
            id: userId, 
            balance: newBalance,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });

        if (upsertError) throw upsertError;

        // 3. Record transaction
        await supabase.from('transactions').insert({
          user_id: userId,
          amount: amount,
          type: 'deposit',
          description: `Recarga via PIX - MP #${id}`,
          status: 'success'
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Erro no Webhook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
