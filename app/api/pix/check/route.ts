import { NextResponse } from 'next/server';
import { asaas } from '@/lib/asaas';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!paymentId || !userId) {
      return NextResponse.json({ error: 'ID do pagamento ou do usuário faltando' }, { status: 400 });
    }

    // --- NOVA LÓGICA PARA PIX ESTÁTICO ---
    if (paymentId.startsWith('STATIC_')) {
      // 1. Buscar a transação pendente no banco (com data de criação)
      const { data: tx } = await supabaseAdmin
        .from('transactions')
        .select('*')
        .eq('external_id', paymentId)
        .single();

      if (!tx) {
        return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 });
      }

      if (tx.status === 'success') {
        return NextResponse.json({ status: 'approved', amount: tx.amount });
      }

      const expectedAmount = parseFloat(tx.amount);
      const createdAt = new Date(tx.created_at);

      // 2. Consultar Extrato do Asaas
      const asaasUrl = process.env.ASAAS_API_URL || 'https://api.asaas.com/v3';
      const asaasKey = process.env.ASAAS_API_KEY || '';

      // Busca em pix/transactions E financialTransactions com limite maior
      const asaasRes = await fetch(`${asaasUrl}/pix/transactions?limit=100`, {
        headers: { 'access_token': asaasKey.trim() }
      });

      let asaasData = await asaasRes.json();
      let transactions = asaasData.data || [];

      // Sempre busca também no extrato financeiro para garantir cobertura total
      const finRes = await fetch(`${asaasUrl}/financialTransactions?limit=100`, {
        headers: { 'access_token': asaasKey.trim() }
      });
      const finData = await finRes.json();
      const finTransactions = finData.data || [];

      // Mescla as duas listas removendo duplicatas por ID
      const allIds = new Set(transactions.map((t: any) => t.id));
      for (const t of finTransactions) {
        if (!allIds.has(t.id)) {
          transactions.push(t);
          allIds.add(t.id);
        }
      }

      // Buscar IDs já usados para evitar duplo crédito
      const { data: usedTxs } = await supabaseAdmin
        .from('transactions')
        .select('description')
        .not('description', 'is', null)
        .order('created_at', { ascending: false })
        .limit(200);
      
      const usedAsaasIds = usedTxs?.map((tx: any) => tx.description) || [];

      // Nome do pagador (opcional — usado só como desempate)
      const payerName = paymentId.split('_').slice(2).join(' ').replace(/_/g, ' ').toUpperCase();

      // 3. Coletar todos os candidatos por valor + tempo
      const candidates: any[] = [];
      // Data de criação no formato YYYY-MM-DD (Brasil)
      const brCreatedAt = new Date(createdAt.getTime() - 3 * 60 * 60 * 1000);
      const createdDateStr = brCreatedAt.toISOString().substring(0, 10);

      for (const t of transactions) {
        if (usedAsaasIds.includes(t.id)) continue;

        const tValue = Math.abs(parseFloat(t.value || t.netValue || '0'));
        const valueMatches = Math.abs(tValue - expectedAmount) < 0.05; // tolerância de 5 centavos

        // Asaas /financialTransactions retorna date como "YYYY-MM-DD" (sem hora)
        // Comparar só a data evita erro de fuso horário
        const tDateRaw = t.dateCreated || t.date || t.effectiveDate || t.paymentDate || t.created_at;
        let isRecent = true; // se não tem data, inclui sempre
        if (tDateRaw) {
          if (String(tDateRaw).length === 10) {
            // Apenas data (YYYY-MM-DD): compara só a parte da data
            isRecent = String(tDateRaw) >= createdDateStr;
          } else {
            // Datetime completo: compara normalmente
            isRecent = new Date(tDateRaw) >= createdAt;
          }
        }

        if (valueMatches && isRecent) {
          candidates.push(t);
        }
      }

      // 4. Escolher o melhor candidato
      let matched = null;

      if (candidates.length === 1) {
        // Apenas 1 candidato com o valor certo no período → aprova direto, sem precisar do nome
        matched = candidates[0];
      } else if (candidates.length > 1) {
        // Mais de 1 candidato com mesmo valor → tenta usar nome como desempate
        if (payerName && payerName.trim().length > 2) {
          const nameParts = payerName.split(' ').filter((p: string) => p.length > 2);
          const nameMatch = candidates.find((t: any) => {
            const tName = (t.payer?.name || t.description || '').toUpperCase();
            return nameParts.some((part: string) => tName.includes(part));
          });
          // Se achou pelo nome, usa esse. Senão, pega o mais recente como fallback
          matched = nameMatch || candidates.sort((a: any, b: any) => {
            const dA = new Date(a.date || a.effectiveDate || 0).getTime();
            const dB = new Date(b.date || b.effectiveDate || 0).getTime();
            return dB - dA; // mais recente primeiro
          })[0];
        } else {
          // Sem nome digitado → pega o mais recente
          matched = candidates.sort((a: any, b: any) => {
            const dA = new Date(a.date || a.effectiveDate || 0).getTime();
            const dB = new Date(b.date || b.effectiveDate || 0).getTime();
            return dB - dA;
          })[0];
        }
      }

      // 5. Se achou, aprova
      if (matched) {
        console.log("Match encontrado! Aprovando...", matched.id);
        const { error: updateTxError } = await supabaseAdmin
          .from('transactions')
          .update({ 
            status: 'success',
            description: matched.id
          })
          .eq('external_id', paymentId);
          
        if (updateTxError) throw updateTxError;

        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('balance')
          .eq('id', userId)
          .single();
          
        const newBalance = (profile?.balance || 0) + expectedAmount;

        const { error: updateProfileError } = await supabaseAdmin
          .from('profiles')
          .update({ balance: newBalance })
          .eq('id', userId);
          
        if (updateProfileError) throw updateProfileError;

        return NextResponse.json({ 
          status: 'approved', 
          amount: expectedAmount, 
          newBalance: newBalance 
        });
      }

      return NextResponse.json({ status: 'pending' });
    }
    // --- FIM LOGICA ESTÁTICA ---

    let status = await asaas.getPaymentStatus(paymentId);
    // Se o pagamento atual estiver pendente, não fazemos mais fallback global
    // O webhook cuidará de atualizar o saldo se outros pagamentos forem confirmados.
    // Manter a verificação estritamente para o paymentId solicitado para evitar confusão no frontend.


    // Debug Log
    await supabaseAdmin.from('webhook_logs').insert({
      payload: { 
        source: 'check_route_asaas', 
        paymentId: paymentId, 
        originalId: paymentId,
        status: status
      },
      created_at: new Date().toISOString()
    });

    if (status === 'approved') {
      // In Asaas, we might need the amount if it's not passed, but usually it's better to fetch it
      const response = await fetch(`${process.env.ASAAS_API_URL || 'https://api.asaas.com/v3'}/payments/${paymentId}`, {
        headers: {
          'access_token': (process.env.ASAAS_API_KEY || '').trim(),
          'Content-Type': 'application/json'
        }
      });
      const paymentData = await response.json();
      console.log('Dados do pagamento aprovado:', paymentData);
      const amount = parseFloat(String(paymentData.value || '0'));

      // 1. Call RPC for atomic update
      const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('handle_payment_success', {
        p_user_id: userId,
        p_amount: amount,
        p_payment_id: paymentId
      });

      if (rpcError) {
        await supabaseAdmin.from('webhook_logs').insert({
          payload: { 
            source: 'check_route_error_asaas', 
            step: 'rpc_call',
            paymentId, 
            userId,
            error: rpcError 
          }
        });
        throw rpcError;
      }

      if (rpcResult.status === 'already_processed') {
        return NextResponse.json({ status: 'already_processed', balance: null });
      }

      // Debug Log Success
      await supabaseAdmin.from('webhook_logs').insert({
        payload: { 
          source: 'check_route_success_asaas', 
          paymentId, 
          userId,
          amount,
          previousBalance: rpcResult.oldBalance,
          newBalance: rpcResult.newBalance 
        }
      });

      return NextResponse.json({ 
        status: 'approved', 
        amount, 
        newBalance: rpcResult.newBalance 
      });
    }

    return NextResponse.json({ status: status });
  } catch (error: any) {
    console.error('Erro ao verificar pagamento no Asaas:', error);
    await supabaseAdmin.from('webhook_logs').insert({
      payload: { 
        source: 'check_route_error_asaas', 
        paymentId: new URL(request.url).searchParams.get('id'),
        error: error.message,
        stack: error.stack
      }
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
