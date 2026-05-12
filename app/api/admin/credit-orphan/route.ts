import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const { email, amount, asaasId } = await request.json();

    if (!email || !amount || !asaasId) {
      return NextResponse.json({ error: 'Dados faltando (e-mail, valor ou ID Asaas)' }, { status: 400 });
    }

    // 1. Verificar se o e-mail existe
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, balance')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Usuário não encontrado com este e-mail.' }, { status: 404 });
    }

    // 2. Verificar se esse ID do Asaas já foi usado (segurança extra)
    const { data: used } = await supabaseAdmin
      .from('transactions')
      .select('id')
      .eq('description', asaasId)
      .eq('status', 'success')
      .maybeSingle();

    if (used) {
      return NextResponse.json({ error: 'Este pagamento já foi creditado anteriormente.' }, { status: 400 });
    }

    // 3. Creditar o usuário usando a RPC handle_payment_success (atômico e seguro)
    // Usamos o asaasId como p_payment_id para garantir que não duplique
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('handle_payment_success', {
      p_user_id: profile.id,
      p_amount: parseFloat(amount),
      p_payment_id: `MANUAL_${asaasId}` // Prefixo para identificar que foi manual
    });

    if (rpcError) throw rpcError;

    // 4. Atualizar a descrição da transação criada para o ID real do Asaas
    await supabaseAdmin
      .from('transactions')
      .update({ description: asaasId })
      .eq('external_id', `MANUAL_${asaasId}`);

    return NextResponse.json({ 
      success: true, 
      message: `R$ ${amount} creditados com sucesso para ${email}`,
      newBalance: rpcResult.newBalance
    });

  } catch (error: any) {
    console.error('Erro no crédito manual:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
