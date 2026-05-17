import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { asaas } from '@/lib/asaas';

export async function POST(request: Request) {
  try {
    const { amount, description, userId, cpf, payerName } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário não fornecido' }, { status: 400 });
    }

    if (!payerName) {
      return NextResponse.json({ error: 'Nome do pagador não fornecido' }, { status: 400 });
    }

    const baseAmount = parseFloat(amount);

    // Busca email do perfil para criar cliente no Asaas
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email, cpf')
      .eq('id', userId)
      .single();

    const customerEmail = profile?.email;
    const customerCpf = cpf || profile?.cpf;

    if (!customerEmail) {
      return NextResponse.json({ error: 'Email do usuário não encontrado' }, { status: 400 });
    }

    console.log('--- Gerando PIX Dinâmico Asaas ---');
    console.log('User:', userId, '| Valor: R$', baseAmount);

    // Cria ou recupera cliente no Asaas
    const customerId = await asaas.getOrCreateCustomer(customerEmail, payerName, customerCpf || undefined);

    // Gera cobrança PIX no Asaas (QR Code dinâmico)
    const pixPayment = await asaas.createPixPayment(
      customerId,
      baseAmount,
      description || `Recarga Central GSM - R$ ${baseAmount}`,
      userId
    );

    // Salva transação pendente no banco com o ID real do Asaas
    const { error: dbError } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: userId,
        amount: baseAmount,
        status: 'pending',
        external_id: pixPayment.id,
        type: 'pix'
      });

    if (dbError) {
      console.error('Erro ao salvar transação pendente:', dbError);
      return NextResponse.json({ error: `Erro BD: ${dbError.message}` }, { status: 500 });
    }

    return NextResponse.json({
      id: pixPayment.id,
      copy_paste: pixPayment.copyPaste,
      qr_code_base64: pixPayment.qrCode,
      qr_code_url: null
    });

  } catch (error: any) {
    console.error('Erro ao gerar PIX Dinâmico:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
