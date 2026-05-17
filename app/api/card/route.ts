import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { asaas } from '@/lib/asaas';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  // 🔴 PAGAMENTOS TEMPORARIAMENTE SUSPENSOS - INVESTIGAÇÃO EM CURSO
  return NextResponse.json({ error: 'Pagamentos temporariamente suspensos para manutenção. Tente novamente em breve.' }, { status: 503 });
  try {
    // Pegar o token do header de authorization
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Usuário inválido ou sessão expirada' }, { status: 401 });
    }

    const { amount, payerName } = await request.json();
    const parsedAmount = parseFloat(amount);

    if (!parsedAmount || parsedAmount < 5) {
      return NextResponse.json({ error: 'O valor mínimo é R$ 5,00' }, { status: 400 });
    }

    // Calcular repasse da taxa do Asaas: 1,89% + R$ 0,35
    // Fórmula: Total = (Desejado + 0.35) / (1 - 0.0189)
    const baseValue = parsedAmount;
    const chargeAmount = (baseValue + 0.35) / (1 - 0.0189);
    const finalCharge = parseFloat(chargeAmount.toFixed(2));

    // Buscar CPF se existir
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('cpf, full_name, email')
      .eq('id', user.id)
      .single();

    const customerName = profile?.full_name || payerName;

    if (!customerName || customerName.trim().length < 3) {
       return NextResponse.json({ error: 'O nome do titular é obrigatório. Preencha o campo "Seu Nome" corretamente.' }, { status: 400 });
    }

    const customerEmail = profile?.email || user.email;

    // Criar ou recuperar cliente Asaas
    const customerId = await asaas.getOrCreateCustomer(
      customerEmail!,
      customerName,
      profile?.cpf || undefined
    );

    // Gerar pagamento UNDEFINED no Asaas (Para escolherem Cartão na tela)
    const paymentDescription = `Adição de Saldo - ${customerName}`;
    const paymentRes = await asaas.createCardPayment(
      customerId,
      finalCharge,
      paymentDescription,
      user.id
    );

    // Salvar transação pendente no banco (salvamos o valor BASE para o saldo, mas o Asaas cobrará finalCharge)
    const { error: insertError } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: user.id,
        amount: baseValue, // Salvamos quanto ele quer receber limpo
        type: 'credit_card',
        status: 'pending',
        external_id: paymentRes.id // ID real da cobrança do Asaas: ex pay_12345
      });

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({ 
      invoiceUrl: paymentRes.invoiceUrl,
      paymentId: paymentRes.id,
      finalCharge: finalCharge
    });

  } catch (error: any) {
    console.error('Erro na geração do link de cartão:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao processar o pagamento' }, 
      { status: 500 }
    );
  }
}
