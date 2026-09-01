import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { efibank } from '@/lib/efibank';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    console.log('[SYNC-EFI] Iniciando verificação de PIX Efí pagos mas ainda pending...');

    // 1. Busca todas as transações PIX pendentes recentes (cobranças dinâmicas Efí)
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const { data: pendingTxs, error: pendingError } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('status', 'pending')
      .eq('type', 'pix')
      .gte('created_at', threeDaysAgo);

    if (pendingError) throw pendingError;

    // Só transações cujo external_id parece txid da Efí (cobrança dinâmica)
    const txids = (pendingTxs || [])
      .map((t: any) => t.external_id)
      .filter((id: string) => id && !id.startsWith('STATIC_') && !id.startsWith('pay_'));

    console.log(`[SYNC-EFI] ${txids.length} cobrança(s) pendente(s) para consultar na Efí.`);

    let creditedCount = 0;
    const results = [];
    const stillPending = [];
    const errors = [];

    for (const txid of txids) {
      try {
        const cob = await efibank.consultarCobranca(txid) as any;
        const paid =
          cob?.status === 'CONCLUIDA' ||
          (Array.isArray(cob?.pix) && cob.pix.length > 0);

        if (!paid) {
          stillPending.push(txid);
          continue;
        }

        // Buscar a transação atual (pode ter sido creditada entre a query e aqui)
        const { data: tx } = await supabaseAdmin
          .from('transactions')
          .select('*')
          .eq('external_id', txid)
          .maybeSingle();

        if (!tx) {
          errors.push({ txid, reason: 'transação não encontrada' });
          continue;
        }

        if (tx.status === 'success' || tx.status === 'approved') {
          results.push({ txid, status: 'already_credited' });
          continue;
        }

        const endToEndId = cob?.pix?.[0]?.endToEndId || null;

        // Marca como sucesso
        const { error: updateError } = await supabaseAdmin
          .from('transactions')
          .update({ status: 'success', description: endToEndId || tx.description })
          .eq('id', tx.id);

        if (updateError) throw updateError;

        // Credita o saldo
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('balance')
          .eq('id', tx.user_id)
          .single();

        const newBalance = (profile?.balance || 0) + Number(tx.amount);
        await supabaseAdmin.from('profiles').update({ balance: newBalance }).eq('id', tx.user_id);

        creditedCount++;
        results.push({
          txid,
          status: 'credited',
          user_id: tx.user_id,
          amount: tx.amount,
          newBalance
        });
        console.log(`[SYNC-EFI] ✅ PIX creditado: R$ ${tx.amount} para user ${tx.user_id} (txid ${txid})`);
      } catch (e: any) {
        errors.push({ txid, reason: e.message });
      }
    }

    return NextResponse.json({
      success: true,
      checked: txids.length,
      credited: creditedCount,
      results,
      still_pending: stillPending.length,
      errors
    });
  } catch (error: any) {
    console.error('[SYNC-EFI] Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
