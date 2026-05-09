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

    // Código do Pix Estático do Asaas gerado (Chave: 04b916fe-a03c-42b3-a04a-420ce162682a)
    const pixCopyPaste = "00020126580014br.gov.bcb.pix013604b916fe-a03c-42b3-a04a-420ce162682a5204000053039865802BR5923ISRAEL CANDIDO DA SILVA6009SAO PAULO62070503***63047E9B";

    return NextResponse.json({
      id: pendingId,
      qr_code: pixCopyPaste,
      // Passando uma URL pública para renderizar o QR Code no frontend
      qr_code_base64: null,
      qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixCopyPaste)}`,
      copy_paste: pixCopyPaste,
    });
  } catch (error: any) {
    console.error('Erro ao gerar Pix Estático:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
