import { supabaseAdmin } from '@/lib/supabase-admin';
import { efibank } from '@/lib/efibank';

/**
 * Varre as transações PIX pendentes e credita aquelas que já foram pagas
 * na Efí Bank (status CONCLUIDA). Usado pela página (check), por demanda
 * e pelo cron diário. Não depende de webhook nem de mTLS.
 */
export async function syncEfiPendingPayments({ lookbackDays = 3 }: { lookbackDays?: number } = {}) {
  const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString();

  const { data: pendingTxs, error: pendingError } = await supabaseAdmin
    .from('transactions')
    .select('*')
    .eq('status', 'pending')
    .eq('type', 'pix')
    .gte('created_at', since);

  if (pendingError) throw pendingError;

  // Só cobranças dinâmicas da Efí (txid). Ignora PIX estático (STATIC_*) e Asaas (pay_*).
  const txids = (pendingTxs || [])
    .map((t: any) => t.external_id)
    .filter((id: string) => id && !id.startsWith('STATIC_') && !id.startsWith('pay_'));

  const results = [];
  const errors = [];
  let creditedCount = 0;

  for (const txid of txids) {
    try {
      const cob = await efibank.consultarCobranca(txid) as any;
      const paid =
        cob?.status === 'CONCLUIDA' ||
        (Array.isArray(cob?.pix) && cob.pix.length > 0);

      if (!paid) continue;

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

      const { error: updateError } = await supabaseAdmin
        .from('transactions')
        .update({ status: 'success', description: endToEndId || tx.description })
        .eq('id', tx.id);

      if (updateError) throw updateError;

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
    } catch (e: any) {
      errors.push({ txid, reason: e.message });
    }
  }

  return { checked: txids.length, credited: creditedCount, results, errors };
}