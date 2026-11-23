import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { efibank } from '@/lib/efibank';
import { asaas } from '@/lib/asaas';
import { getGatewaySettings } from '@/lib/gateway-config';

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
    if (isNaN(baseAmount) || baseAmount < 1) {
      return NextResponse.json({ error: 'Valor inválido para recarga' }, { status: 400 });
    }

    // Busca email e CPF do perfil
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email, cpf')
      .eq('id', userId)
      .single();

    const customerCpf = cpf || profile?.cpf;
    const customerEmail = profile?.email || `cliente_${userId}@centralgsm.com.br`;

    // Carrega qual gateway de pagamento está ativo
    const settings = await getGatewaySettings();
    const activeGateway = settings.active_gateway || 'asaas';

    if (activeGateway === 'none') {
      return NextResponse.json({ error: 'Recargas via PIX estão temporariamente desativadas. Tente novamente mais tarde.' }, { status: 400 });
    }

    let pixPayment: any = null;

    if (activeGateway === 'asaas') {
      console.log('--- Gerando PIX Dinâmico Asaas ---');
      console.log('User:', userId, '| Valor: R$', baseAmount);

      const customerId = await asaas.getOrCreateCustomer(
        customerEmail,
        payerName,
        customerCpf
      );

      pixPayment = await asaas.createPixPayment(
        customerId,
        baseAmount,
        description || `Recarga Central GSM - R$ ${baseAmount}`,
        userId
      );
    } else {
      console.log('--- Gerando PIX Dinâmico Efí Bank ---');
      console.log('User:', userId, '| Valor: R$', baseAmount);

      pixPayment = await efibank.createPixPayment(
        baseAmount,
        description || `Recarga Central GSM - R$ ${baseAmount}`,
        userId,
        customerCpf,
        payerName
      );
    }

    if (!pixPayment?.id) {
      throw new Error(`Falha ao gerar cobrança no banco ${activeGateway}. Verifique as chaves configuradas.`);
    }

    // Salva transação pendente no banco
    const { error: dbError } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: userId,
        amount: baseAmount,
        status: 'pending',
        external_id: pixPayment.id,
        type: 'pix',
        description: `Recarga via ${activeGateway === 'asaas' ? 'Asaas' : 'Efí Bank'}`
      });

    if (dbError) {
      console.error('Erro ao salvar transação pendente:', dbError);
      return NextResponse.json({ error: `Erro BD: ${dbError.message}` }, { status: 500 });
    }

    return NextResponse.json({
      id: pixPayment.id,
      copy_paste: pixPayment.copyPaste,
      qr_code_base64: pixPayment.qrCode,
      qr_code_url: pixPayment.invoiceUrl || null,
      gateway: activeGateway
    });

  } catch (error: any) {
    console.error('Erro ao gerar PIX Dinâmico:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
