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

    // We only care about success events
    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      const paymentId = payment.id;

      // BARRAGEM DE SEGURANÇA (ANTI-FRAUDE)
      // O site não confia mais no payload que chegou. Ele vai no Asaas checar se o Pix realmente existe.
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
         console.error('Anti-fraude: Tentativa de forçar status, o status real é:', verifiedPayment.status);
         return NextResponse.json({ error: 'O pagamento real não consta como pago' }, { status: 400 });
      }

      // EXTRAIR VALOR ÚNICA E EXCLUSIVAMENTE DA RESPOSTA OFICIAL DO ASAAS
      const amount = parseFloat(String(verifiedPayment.value || '0'));
      const userId = verifiedPayment.externalReference;

      if (!userId) {
        console.error('UserId missing in Asaas payment externalReference:', paymentId);
        return NextResponse.json({ error: 'externalReference missing' });
      }

      console.log('Asaas processing webhook success:', { userId, amount, paymentId });

      // Crédito Seguro Direto (Evitando RPC e usando o valor BASE que salvamos no banco)
      // Buscar a transação original
      const { data: tx, error: txError } = await supabaseAdmin
        .from('transactions')
        .select('*')
        .eq('external_id', paymentId)
        .single();

      if (txError || !tx) {
         console.error('Transação não encontrada no banco para o paymentId:', paymentId);
         return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 });
      }

      if (tx.status === 'success' || tx.status === 'approved') {
         console.log('Transação já processada anteriormente:', paymentId);
         return NextResponse.json({ received: true, note: 'already processed' });
      }

      // 1. Atualiza Transação
      await supabaseAdmin
        .from('transactions')
        .update({ status: 'success' })
        .eq('id', tx.id);

      // 2. Busca Perfil
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('balance')
        .eq('id', tx.user_id)
        .single();

      const newBalance = (profile?.balance || 0) + tx.amount;

      // 3. Atualiza Saldo
      await supabaseAdmin
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', tx.user_id);

      console.log(`Saldo creditado com sucesso: R$ ${tx.amount} para user ${tx.user_id}. Saldo atual: ${newBalance}`);
    } 
    // Handle Chargebacks or Refunds (FRAUD PROTECTION)
    else if (event === 'PAYMENT_CHARGEBACK_REQUESTED' || event === 'PAYMENT_REFUNDED') {
      const paymentId = payment.id;
      const amount = parseFloat(String(payment.value || '0'));
      const userId = payment.externalReference;
      const eventType = event === 'PAYMENT_CHARGEBACK_REQUESTED' ? 'CHARGEBACK' : 'REFUND';

      if (!userId) {
        console.error('FRAUD ALERT: userId missing in contested payment:', paymentId);
        return NextResponse.json({ error: 'externalReference missing' });
      }

      console.warn(`FRAUD DETECTED (${eventType}):`, { userId, amount, paymentId });

      // 1. Call RPC to deduct balance and log fraud
      const { data: fraudResult, error: fraudError } = await supabaseAdmin.rpc('handle_payment_fraud', {
        p_user_id: userId,
        p_amount: amount,
        p_payment_id: paymentId,
        p_event_type: eventType,
        p_details: { original_payload: body }
      });

      if (fraudError) {
        console.error('Error logging fraud in database:', fraudError);
        // We continue anyway to try and ban the user
      }

      // 2. Get user's CPF before deleting
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('cpf, email')
        .eq('id', userId)
        .single();

      // 3. Blacklist the CPF
      if (profile?.cpf) {
        await supabaseAdmin.from('cpf_blacklist').upsert({
          cpf: profile.cpf,
          reason: `Auto-ban: ${eventType} Pix/Cartão Pagamento ${paymentId}`
        }, { onConflict: 'cpf' });
      }

      // 4. Delete the Auth User
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (deleteError) {
        console.error('Error deleting fraudulent user:', deleteError);
      } else {
        console.log(`Fraudulent user ${profile?.email || userId} banned and deleted.`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Erro no Webhook do Asaas:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
