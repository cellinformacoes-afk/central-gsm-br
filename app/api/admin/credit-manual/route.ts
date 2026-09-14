import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { email, amount, isTest } = await request.json();

    if (!email || !amount) {
      return NextResponse.json({ error: 'E-mail e valor são obrigatórios' }, { status: 400 });
    }

    // Busca case-insensitive para aceitar emails em maiúsculas ou minúsculas
    let { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, balance')
      .ilike('email', email.trim())
      .single();

    // Fallback: busca via auth.users caso profiles não tenha campo email ou email esteja diferente
    if (profileError || !profile) {
      const { data: { users }, error: authErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      if (!authErr) {
        const authUser = users.find(u => u.email?.toLowerCase() === email.trim().toLowerCase());
        if (authUser) {
          const { data: profileById } = await supabaseAdmin
            .from('profiles')
            .select('id, balance')
            .eq('id', authUser.id)
            .single();
          if (profileById) {
            profile = profileById;
            profileError = null;
          }
        }
      }
    }

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Usuário não encontrado com este e-mail.' }, { status: 404 });
    }

    const transactionId = 'MANUAL_' + crypto.randomUUID();

    if (isTest) {
      // Just update balance and add a manual transaction (doesn't count in daily revenue)
      const newBalance = (profile.balance || 0) + parseFloat(amount);
      await supabaseAdmin.from('profiles').update({ balance: newBalance }).eq('id', profile.id);
      
      await supabaseAdmin.from('transactions').insert({
        user_id: profile.id,
        amount: parseFloat(amount),
        type: 'manual_credit',
        status: 'manual',
        description: 'Crédito manual (Cortesia/Teste)',
        external_id: transactionId
      });
      
      return NextResponse.json({ success: true, message: `R$ ${amount} adicionados como teste/cortesia (Não somou nas vendas).` });
    } else {
      // Use RPC to count as real payment
      const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('handle_payment_success', {
        p_user_id: profile.id,
        p_amount: parseFloat(amount),
        p_payment_id: transactionId
      });

      if (rpcError) throw rpcError;

      // Update description
      await supabaseAdmin
        .from('transactions')
        .update({ description: 'Crédito recuperado manualmente' })
        .eq('external_id', transactionId);

      return NextResponse.json({ success: true, message: `R$ ${amount} creditados com sucesso (Somado nas vendas de hoje).` });
    }
  } catch (error: any) {
    console.error('Erro no crédito manual:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
