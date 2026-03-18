import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { amount, description, userId } = await request.json();
    
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json({ 
        error: 'Chave do Mercado Pago não encontrada no servidor.',
        debug: 'Verifique se a variável MERCADO_PAGO_ACCESS_TOKEN foi adicionada corretamente na Vercel.'
      }, { status: 500 });
    }

    const client = new MercadoPagoConfig({ 
      accessToken: accessToken,
      options: { timeout: 5000 }
    });

    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário não fornecido' }, { status: 400 });
    }

    const payment = new Payment(client);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.centralgsm.com.br';
    const body = {
      transaction_amount: parseFloat(amount),
      description: description || 'Recarga de Saldo - Central GSM',
      payment_method_id: 'pix',
      payer: {
        email: 'cliente@centralgsm.com.br',
      },
      notification_url: `${siteUrl}/api/webhooks/mercadopago`,
      metadata: {
        user_id: userId
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
