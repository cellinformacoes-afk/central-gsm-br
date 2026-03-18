import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
       return NextResponse.json({ error: 'Token não encontrado' }, { status: 500 });
    }

    const client = new MercadoPagoConfig({ 
      accessToken: accessToken 
    });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('data.id') || searchParams.get('id');
    const type = searchParams.get('type');

    if (type === 'payment' && id) {
      const payment = new Payment(client);
      const paymentData = await payment.get({ id });

      if (paymentData.status === 'approved') {
        const userId = paymentData.metadata.user_id;
        const amount = paymentData.transaction_amount;

        // 1. Get current balance
        const { data: profile } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', userId)
          .single();

        const newBalance = (profile?.balance || 0) + (amount || 0);

        // 2. Update profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ balance: newBalance })
          .eq('id', userId);

        if (updateError) throw updateError;

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
