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

    // Salvar transação pendente no banco de dados
    // Vamos embutir o nome no ID já que a coluna metadata não existe
    const safeName = payerName.trim().replace(/[^a-zA-Z0-9]/g, '_');
    const pendingId = `STATIC_${Date.now()}_${safeName}`;

    const { error: dbError } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: userId,
        amount: parseFloat(amount),
        status: 'pending',
        external_id: pendingId,
        type: 'pix'
      });

    if (dbError) {
      console.error('Erro ao salvar transação pendente:', dbError);
      return NextResponse.json({ error: `Erro BD: ${dbError.message}` }, { status: 500 });
    }

    // Retornando apenas a chave PIX pura, pois o Asaas bloqueia QR codes genéricos.
    const pixKey = "569ca170-dc32-4744-ab42-0d966b9db179";

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
