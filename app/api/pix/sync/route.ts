import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    console.log('--- Iniciando Sincronização em Segundo Plano (PIX Estático) ---');

    // 1. Buscar transações PENDENTES de PIX das últimas 4 horas
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    
    const { data: pendingTxs, error: pendingError } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('status', 'pending')
      .eq('type', 'pix')
      .gte('created_at', fourHoursAgo);

    if (pendingError) throw pendingError;

    // 2. Consultar Extrato do Asaas (Financial Transactions + Pix Transactions)
    const asaasUrl = process.env.ASAAS_API_URL || 'https://api.asaas.com/v3';
    const asaasKey = (process.env.ASAAS_API_KEY || '').trim();

    const [asaasPixRes, asaasFinRes] = await Promise.all([
      fetch(`${asaasUrl}/pix/transactions?limit=100`, { headers: { 'access_token': asaasKey } }),
      fetch(`${asaasUrl}/financialTransactions?limit=100`, { headers: { 'access_token': asaasKey } })
    ]);

    const asaasPixData = await asaasPixRes.json();
    const asaasFinData = await asaasFinRes.json();

    let allAsaasTxs = [...(asaasPixData.data || []), ...(asaasFinData.data || [])];
    
    // Remover duplicatas por ID
    const seenIds = new Set();
    allAsaasTxs = allAsaasTxs.filter(t => {
      if (seenIds.has(t.id)) return false;
      seenIds.add(t.id);
      return true;
    });

    // 3. Buscar IDs de transações já processadas para evitar duplo crédito
    const { data: usedTxs } = await supabaseAdmin
      .from('transactions')
      .select('description')
      .not('description', 'is', null)
      .eq('status', 'success')
      .order('created_at', { ascending: false })
      .limit(300);
    
    const usedAsaasIds = new Set(usedTxs?.map((tx: any) => tx.description) || []);

    let processedCount = 0;
    const results = [];
    const unmatchedAsaas = [];

    // 4. Mapear pagamentos do Asaas que NÃO foram usados ainda
    const asaasTxsToProcess = allAsaasTxs.filter(t => !usedAsaasIds.has(t.id));

    // 5. Loop de Sincronização (Aprovação Automática)
    if (pendingTxs && pendingTxs.length > 0) {
      for (const tx of pendingTxs) {
        const expectedAmount = parseFloat(tx.amount);
        const createdAt = new Date(tx.created_at);
        const createdDateStr = createdAt.toISOString().substring(0, 10);
        const paymentId = tx.external_id || '';
        
        const payerName = paymentId.includes('_') 
          ? paymentId.split('_').slice(2).join(' ').replace(/_/g, ' ').toUpperCase()
          : '';

        const candidates = [];

        for (const t of asaasTxsToProcess) {
          if (results.some(r => r.asaasId === t.id)) continue;

          const tValue = Math.abs(parseFloat(t.value || t.netValue || '0'));
          const valueMatches = Math.abs(tValue - expectedAmount) < 0.05;

          const tDateRaw = t.dateCreated || t.date || t.effectiveDate || t.paymentDate || t.created_at;
          let isRecent = true;
          if (tDateRaw) {
            if (String(tDateRaw).length === 10) {
              isRecent = String(tDateRaw) >= createdDateStr;
            } else {
              // Margem de 10 minutos para pagamentos feitos logo antes ou logo depois
              isRecent = new Date(tDateRaw) >= new Date(createdAt.getTime() - 10 * 60 * 1000);
            }
          }

          if (valueMatches && isRecent) {
            candidates.push(t);
          }
        }

        let matched = null;
        if (candidates.length === 1) {
          matched = candidates[0];
        } else if (candidates.length > 1) {
          if (payerName) {
            const nameParts = payerName.split(' ').filter((p: string) => p.length > 2);
            matched = candidates.find((t: any) => {
              const tName = (t.payer?.name || t.description || '').toUpperCase();
              return nameParts.some((part: string) => tName.includes(part));
            }) || candidates[0];
          } else {
            matched = candidates[0];
          }
        }

        if (matched) {
          const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('handle_payment_success', {
            p_user_id: tx.user_id,
            p_amount: expectedAmount,
            p_payment_id: paymentId
          });

          if (!rpcError) {
            await supabaseAdmin.from('transactions')
              .update({ description: matched.id })
              .eq('id', tx.id);
              
            processedCount++;
            results.push({ txId: tx.id, status: 'success', asaasId: matched.id, name: matched.payer?.name || matched.description });
          }
        }
      }
    }

    // 6. Identificar quem sobrou no Asaas (pagamentos sem dono no site)
    const matchedAsaasIds = new Set(results.map(r => r.asaasId));
    for (const t of asaasTxsToProcess) {
      if (!matchedAsaasIds.has(t.id)) {
        unmatchedAsaas.push({
          id: t.id,
          value: t.value || t.netValue,
          date: t.dateCreated || t.date,
          payer: t.payer?.name || t.description
        });
      }
    }

    return NextResponse.json({
      summary: `Processadas ${processedCount} transações de ${pendingTxs?.length || 0} pendentes.`,
      matched: results,
      unmatched_in_asaas: unmatchedAsaas.slice(0, 10) // Mostrar apenas as 10 mais recentes
    });

  } catch (error: any) {
    console.error('Erro na sincronização de fundo:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
