import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const event = body.event;
    const payment = body.payment;

    // Log the webhook call
    await supabaseAdmin.from('webhook_logs').insert({
      payload: body,
      source: 'asaas_webhook',
      created_at: new Date().toISOString()
    });

    // =====================================================
    // COBRANÇAS ASAAS (Cartão / PIX Dinâmico)
    // =====================================================
    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      const paymentId = payment.id;

      // ANTI-FRAUDE: verifica o pagamento diretamente no Asaas
      const asaasResponse = await fetch(`${process.env.ASAAS_API_URL || 'https://api.asaas.com/v3'}/payments/${paymentId}`, {
        headers: {
          'access_token': (process.env.ASAAS_API_KEY || '').trim(),
          'Content-Type': 'application/json'
        }
      });

      if (!asaasResponse.ok) {
        console.error('Anti-fraude: Pagamento não encontrado no Asaas oficial.');
        return NextResponse.json({ error: 'Pagamento não encontrado no sistema' }, { status: 400 });
      }

      const verifiedPayment = await asaasResponse.json();

      if (verifiedPayment.status !== 'RECEIVED' && verifiedPayment.status !== 'CONFIRMED') {
        console.error('Anti-fraude: status real é:', verifiedPayment.status);
        return NextResponse.json({ error: 'O pagamento real não consta como pago' }, { status: 400 });
      }

      const amount = parseFloat(String(verifiedPayment.value || '0'));
      const userId = verifiedPayment.externalReference;

      if (!userId) {
        console.error('UserId missing in externalReference:', paymentId);
        return NextResponse.json({ error: 'externalReference missing' });
      }

      const { data: tx, error: txError } = await supabaseAdmin
        .from('transactions')
        .select('*')
        .eq('external_id', paymentId)
        .single();

      if (txError || !tx) {
        console.error('Transação não encontrada no banco:', paymentId);
        return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 });
      }

      if (tx.status === 'success' || tx.status === 'approved') {
        return NextResponse.json({ received: true, note: 'already processed' });
      }

      await supabaseAdmin.from('transactions').update({ status: 'success' }).eq('id', tx.id);

      const { data: profile } = await supabaseAdmin
        .from('profiles').select('balance').eq('id', tx.user_id).single();

      const newBalance = (profile?.balance || 0) + tx.amount;

      await supabaseAdmin.from('profiles').update({ balance: newBalance }).eq('id', tx.user_id);

      console.log(`✅ Cartão/PIX dinâmico creditado: R$ ${tx.amount} para user ${tx.user_id}`);
    }

    // =====================================================
    // PIX ESTÁTICO — Transferência direta via chave Asaas
    // O Asaas envia PIX_TRANSACTION_RECEIVED para PIX diretos
    // =====================================================
    else if (
      event === 'PIX_TRANSACTION_RECEIVED' ||
      event === 'TRANSFER_RECEIVED' ||
      event === 'RECEIVABLE_CREATED'
    ) {
      const pixData = body.pixTransaction || body.transfer || payment || {};
      const receivedAmount = parseFloat(String(pixData.value || pixData.netValue || '0'));
      const asaasPixId = pixData.id || pixData.endToEndIdentifier || ('PIX_WH_' + Date.now());

      console.log('PIX estático recebido via webhook:', { asaasPixId, receivedAmount, event });

      if (receivedAmount <= 0) {
        return NextResponse.json({ received: true, note: 'valor zerado, ignorado' });
      }

      // Verificar se esse PIX já foi usado
      const { data: alreadyUsed } = await supabaseAdmin
        .from('transactions')
        .select('id')
        .eq('description', asaasPixId)
        .maybeSingle();

      if (alreadyUsed) {
        console.log('PIX já processado anteriormente:', asaasPixId);
        return NextResponse.json({ received: true, note: 'already processed' });
      }

      // Buscar transações pendentes de PIX estático mais recentes
      const { data: pendingTxs } = await supabaseAdmin
        .from('transactions')
        .select('*')
        .eq('status', 'pending')
        .eq('type', 'pix')
        .like('external_id', 'STATIC_%')
        .order('created_at', { ascending: false })
        .limit(20);

      // Encontrar a que tem o valor mais próximo (tolerância de 5 centavos)
      const matched = (pendingTxs || []).find((t: any) =>
        Math.abs(parseFloat(String(t.amount)) - receivedAmount) < 0.05
      );

      if (!matched) {
        console.warn('Nenhuma transação pendente para valor:', receivedAmount);
        // Salva para análise manual
        await supabaseAdmin.from('webhook_logs').insert({
          payload: { ...body, note: 'PIX_SEM_MATCH', receivedAmount, asaasPixId },
          source: 'pix_sem_match',
          created_at: new Date().toISOString()
        });
        return NextResponse.json({ received: true, note: 'sem transação pendente correspondente' });
      }

      // Marca a transação como sucesso com o ID do PIX (evita duplicidade)
      await supabaseAdmin
        .from('transactions')
        .update({ status: 'success', description: asaasPixId })
        .eq('id', matched.id);

      // Credita o saldo
      const { data: profile } = await supabaseAdmin
        .from('profiles').select('balance').eq('id', matched.user_id).single();

      const newBalance = (profile?.balance || 0) + parseFloat(String(matched.amount));

      await supabaseAdmin.from('profiles').update({ balance: newBalance }).eq('id', matched.user_id);

      console.log(`✅ PIX estático creditado: R$ ${matched.amount} para user ${matched.user_id}. Novo saldo: R$ ${newBalance}`);
    }

    // =====================================================
    // ANTI-FRAUDE: Chargeback / Estorno
    // =====================================================
    else if (event === 'PAYMENT_CHARGEBACK_REQUESTED' || event === 'PAYMENT_REFUNDED') {
      const paymentId = payment.id;
      const amount = parseFloat(String(payment.value || '0'));
      const userId = payment.externalReference;
      const eventType = event === 'PAYMENT_CHARGEBACK_REQUESTED' ? 'CHARGEBACK' : 'REFUND';

      if (!userId) {
        return NextResponse.json({ error: 'externalReference missing' });
      }

      console.warn(`FRAUD DETECTED (${eventType}):`, { userId, amount, paymentId });

      const { error: fraudError } = await supabaseAdmin.rpc('handle_payment_fraud', {
        p_user_id: userId,
        p_amount: amount,
        p_payment_id: paymentId,
        p_event_type: eventType,
        p_details: { original_payload: body }
      });

      if (fraudError) console.error('Error logging fraud:', fraudError);

      const { data: profile } = await supabaseAdmin
        .from('profiles').select('cpf, email').eq('id', userId).single();

      if (profile?.cpf) {
        await supabaseAdmin.from('cpf_blacklist').upsert({
          cpf: profile.cpf,
          reason: `Auto-ban: ${eventType} - Pagamento ${paymentId}`
        }, { onConflict: 'cpf' });
      }

      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (deleteError) {
        console.error('Error deleting fraudulent user:', deleteError);
      } else {
        console.log(`Fraudulent user ${profile?.email || userId} banned.`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Erro no Webhook do Asaas:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
