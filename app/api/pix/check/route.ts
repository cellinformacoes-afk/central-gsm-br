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

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;
    const client = new MercadoPagoConfig({ accessToken: accessToken! });
    const payment = new Payment(client);

    const paymentData = await payment.get({ id: paymentId });

    if (paymentData.status === 'approved') {
      const amount = parseFloat(String(paymentData.transaction_amount || '0'));

      // 1. Check if already processed
      const { data: existingTx } = await supabase
        .from('transactions')
        .select('id')
        .eq('description', `Recarga via PIX - MP #${paymentId}`)
        .maybeSingle();

      if (existingTx) {
        return NextResponse.json({ status: 'already_processed', balance: null });
      }

      // 2. Get current balance
      const { data: profile } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', userId)
        .maybeSingle();

      const newBalance = (profile?.balance || 0) + amount;

      // 3. Update profile
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({ 
          id: userId, 
          balance: newBalance,
          updated_at: new Date().toISOString()
        });

      if (upsertError) throw upsertError;

      // 4. Record transaction
      await supabase.from('transactions').insert({
        user_id: userId,
        amount: amount,
        type: 'deposit',
        description: `Recarga via PIX - MP #${paymentId}`,
        status: 'success'
      });

      return NextResponse.json({ status: 'approved', amount, newBalance });
    }

    return NextResponse.json({ status: paymentData.status });
  } catch (error: any) {
    console.error('Erro ao verificar pagamento:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
