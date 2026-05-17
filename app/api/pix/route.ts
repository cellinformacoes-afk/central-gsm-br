import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const { amount, description, userId, cpf, payerName } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário não fornecido' }, { status: 400 });
    }

    if (!payerName) {
      return NextResponse.json({ error: 'Nome do pagador não fornecido' }, { status: 400 });
    }

    console.log('--- Iniciando Geração de Pix Estático ---');
    console.log('User ID:', userId);
    console.log('Amount:', amount);
    console.log('Payer Name:', payerName);

    const baseAmount = parseFloat(amount);
    const safeName = payerName ? payerName.trim().replace(/[^a-zA-Z0-9]/g, '_') : 'ANONIMO';
    const pendingId = `STATIC_${Date.now()}_${safeName}`;

    const { error: dbError } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: userId,
        amount: baseAmount,
        status: 'pending',
        external_id: pendingId,
        type: 'pix'
      });

    if (dbError) {
      console.error('Erro ao salvar transação pendente:', dbError);
      return NextResponse.json({ error: `Erro BD: ${dbError.message}` }, { status: 500 });
    }

    // Retornando apenas a chave PIX pura, pois o Asaas bloqueia QR codes genéricos.
    const pixKey = "63138401000122"; // Chave CNPJ Asaas - cadastrada 17/05/2026

    return NextResponse.json({
      id: pendingId,
      copy_paste: pixKey,
      qr_code_url: null,
      qr_code_base64: null
    });
  } catch (error: any) {
    console.error('Erro ao gerar Pix Estático:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
