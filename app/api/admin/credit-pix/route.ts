import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    // Verificar se o solicitante é admin
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado: somente admins' }, { status: 403 });
    }

    // Receber o ID da transação a ser aprovada
    const { transactionId } = await request.json();

    if (!transactionId) {
      return NextResponse.json({ error: 'transactionId não fornecido' }, { status: 400 });
    }

    // Buscar a transação pendente
    const { data: transaction, error: txError } = await supabaseAdmin
      .from('transactions')
      .select('id, user_id, amount, status, external_id')
      .eq('id', transactionId)
      .single();

    if (txError || !transaction) {
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 });
    }

    if (transaction.status !== 'pending') {
      return NextResponse.json({ error: `Esta transação já está com status: ${transaction.status}` }, { status: 400 });
    }

    // Usar o external_id (txid do Efí Bank) como payment_id para evitar duplicatas
    const paymentId = transaction.external_id || `ADMIN_MANUAL_${transactionId}`;

    // Verificar se esse payment_id já foi processado (segurança extra)
    const { data: alreadyDone } = await supabaseAdmin
      .from('transactions')
      .select('id')
      .eq('external_id', paymentId)
      .eq('status', 'success')
      .maybeSingle();

    if (alreadyDone && alreadyDone.id !== transactionId) {
      return NextResponse.json({ error: 'Este pagamento já foi creditado anteriormente.' }, { status: 400 });
    }

    // Creditar o saldo do cliente via RPC atômica (handle_payment_success)
    const { error: rpcError } = await supabaseAdmin.rpc('handle_payment_success', {
      p_user_id: transaction.user_id,
      p_amount: parseFloat(transaction.amount),
      p_payment_id: paymentId,
    });

    if (rpcError) {
      // Se a RPC criou uma transação nova de success, só marcar a pending como success
      // (pode acontecer se a RPC insere nova linha). Tentar marcar mesmo assim.
      console.error('Erro na RPC handle_payment_success:', rpcError);

      // Fallback: marcar diretamente a transação como success e creditar saldo
      const { data: clientProfile } = await supabaseAdmin
        .from('profiles')
        .select('balance')
        .eq('id', transaction.user_id)
        .single();

      const newBalance = (parseFloat(clientProfile?.balance || '0')) + parseFloat(transaction.amount);

      await supabaseAdmin
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', transaction.user_id);

      await supabaseAdmin
        .from('transactions')
        .update({ status: 'success', description: 'Aprovado manualmente pelo admin' })
        .eq('id', transactionId);

      return NextResponse.json({ success: true, message: 'Saldo creditado via fallback direto.' });
    }

    // Marcar a transação pendente como success e registrar quem aprovou
    await supabaseAdmin
      .from('transactions')
      .update({
        status: 'success',
        description: 'Aprovado manualmente pelo admin',
      })
      .eq('id', transactionId);

    return NextResponse.json({
      success: true,
      message: `R$ ${parseFloat(transaction.amount).toFixed(2)} creditados com sucesso!`,
    });

  } catch (error: any) {
    console.error('Erro em /api/admin/credit-pix:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
