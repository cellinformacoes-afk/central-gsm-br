import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    console.log('--- Iniciando Sincronização em Segundo Plano (PIX Estático) ---');

    // 1. Buscar transações PENDENTES de PIX das últimas 24 horas para ter uma base maior de sugestão
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: pendingTxs, error: pendingError } = await supabaseAdmin
      .from('transactions')
      .select('*, profiles(email)')
      .eq('status', 'pending')
      .eq('type', 'pix')
      .gte('created_at', oneDayAgo);

    if (pendingError) throw pendingError;

    // 2. Consultar Extrato do Asaas
    const asaasUrl = process.env.ASAAS_API_URL || 'https://api.asaas.com/v3';
    const asaasKey = (process.env.ASAAS_API_KEY || '').trim();

    const [asaasPixRes, asaasFinRes] = await Promise.all([
      fetch(`${asaasUrl}/pix/transactions?limit=60`, { headers: { 'access_token': asaasKey } }),
      fetch(`${asaasUrl}/financialTransactions?limit=60`, { headers: { 'access_token': asaasKey } })
    ]);

    const asaasPixData = await asaasPixRes.json();
    const asaasFinData = await asaasFinRes.json();

    let allAsaasTxs = [...(asaasPixData.data || []), ...(asaasFinData.data || [])];
    const seenIds = new Set();
    allAsaasTxs = allAsaasTxs.filter(t => {
      if (seenIds.has(t.id)) return false;
      seenIds.add(t.id);
      return true;
    });

    // 3. Buscar IDs já creditados
    const { data: usedTxs } = await supabaseAdmin
      .from('transactions')
      .select('description')
      .not('description', 'is', null)
      .eq('status', 'success')
      .limit(500);
    
    const usedAsaasIds = new Set(usedTxs?.map((tx: any) => tx.description) || []);

    let processedCount = 0;
    const results = [];
    const unmatchedAsaas = [];

    const asaasTxsToProcess = allAsaasTxs.filter(t => !usedAsaasIds.has(t.id) && parseFloat(t.value || t.netValue || '0') > 0);

    // 4. Loop de Sincronização Automática
    if (pendingTxs && pendingTxs.length > 0) {
      for (const tx of pendingTxs) {
        const expectedAmount = parseFloat(tx.amount);
        const createdAt = new Date(tx.created_at);
        // Converter createdAt para data de Brasília para comparar com o Asaas
        const brCreatedAt = new Date(createdAt.getTime() - 3 * 60 * 60 * 1000);
        const createdDateStr = brCreatedAt.toISOString().substring(0, 10);
        const paymentId = tx.external_id || '';
        
        const payerName = paymentId.includes('_') 
          ? paymentId.split('_').slice(2).join(' ').replace(/_/g, ' ').toUpperCase()
          : '';

        const candidates = asaasTxsToProcess.filter(t => {
          if (results.some(r => r.asaasId === t.id)) return false;
          const tValue = Math.abs(parseFloat(t.value || t.netValue || '0'));
          const valueMatches = Math.abs(tValue - expectedAmount) < 0.05;
          const tDateRaw = t.dateCreated || t.date || t.effectiveDate || t.paymentDate || t.created_at;
          let isRecent = true;
          if (tDateRaw) {
            if (String(tDateRaw).length === 10) {
              isRecent = String(tDateRaw) >= createdDateStr;
            } else {
              isRecent = new Date(tDateRaw) >= new Date(createdAt.getTime() - 15 * 60 * 1000);
            }
          }
          return valueMatches && isRecent;
        });

        let matched = null;
        if (candidates.length === 1) {
          matched = candidates[0];
        } else if (candidates.length > 1 && payerName) {
          const nameParts = payerName.split(' ').filter((p: string) => p.length > 2);
          matched = candidates.find((t: any) => {
            const tName = (t.payer?.name || t.description || '').toUpperCase();
            return nameParts.some((part: string) => tName.includes(part));
          }) || candidates[0];
        }

        if (matched) {
          const { error: rpcError } = await supabaseAdmin.rpc('handle_payment_success', {
            p_user_id: tx.user_id,
            p_amount: expectedAmount,
            p_payment_id: paymentId
          });

          if (!rpcError) {
            // IMPORTANTE: Atualizar tanto a descrição quanto o STATUS para success
            await supabaseAdmin.from('transactions')
              .update({ 
                description: matched.id,
                status: 'success' 
              })
              .eq('id', tx.id);
              
            processedCount++;
            results.push({ txId: tx.id, status: 'success', asaasId: matched.id, name: matched.payer?.name || matched.description });
          }
        }
      }
    }

    // 5. Mapear Órfãos com Sugestão de E-mail
    const matchedAsaasIds = new Set(results.map(r => r.asaasId));
    for (const t of asaasTxsToProcess) {
      if (!matchedAsaasIds.has(t.id)) {
        // Tenta achar um e-mail sugerido (mesmo valor nas últimas 24h)
        const tValue = Math.abs(parseFloat(t.value || t.netValue || '0'));
        const suggestion = pendingTxs?.find(pt => Math.abs(parseFloat(pt.amount) - tValue) < 0.05);

        unmatchedAsaas.push({
          id: t.id,
          value: tValue,
          date: t.dateCreated || t.date,
          payer: t.payer?.name || t.description,
          suggested_email: suggestion?.profiles?.email || ''
        });
      }
    }

    return NextResponse.json({
      summary: `Processadas ${processedCount} transações automáticas.`,
      unmatched_in_asaas: unmatchedAsaas.slice(0, 15)
    });

  } catch (error: any) {
    console.error('Erro na sincronização de fundo:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
