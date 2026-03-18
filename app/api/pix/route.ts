import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { supabase } from '@/lib/supabase';

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || '',
  options: { timeout: 5000 }
});

export async function POST(request: Request) {
  try {
    const { amount, description } = await request.json();
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const payment = new Payment(client);

    const body = {
      transaction_amount: parseFloat(amount),
      description: description || 'Recarga de Saldo - Central GSM',
      payment_method_id: 'pix',
      payer: {
        email: session.user.email,
      },
      notification_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/mercadopago`,
      metadata: {
        user_id: session.user.id
      }
    };

    const result = await payment.create({ body });

    return NextResponse.json({
      id: result.id,
      qr_code: result.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: result.point_of_interaction?.transaction_data?.qr_code_base64,
      copy_paste: result.point_of_interaction?.transaction_data?.qr_code,
    });
  } catch (error: any) {
    console.error('Erro ao gerar Pix:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
