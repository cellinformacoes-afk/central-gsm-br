import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  const { data: logs, error } = await supabaseAdmin
    .from('webhook_logs')
    .select('*')
    .eq('source', 'efibank_webhook')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const issues = [];
  let unmatched = 0;
  for (const log of logs) {
    const body = log.payload;
    if (body && body.pix && Array.isArray(body.pix)) {
      for (const p of body.pix) {
        const txid = p.txid;
        if (!txid) {
          issues.push({ time: log.created_at, error: 'Pix sem txid', endToEndId: p.endToEndId, valor: p.valor });
          unmatched++;
        } else {
          const { data: tx } = await supabaseAdmin
            .from('transactions')
            .select('id, status, user_id')
            .eq('external_id', txid)
            .single();
            
          if (!tx) {
            issues.push({ time: log.created_at, error: 'TXID não encontrado no banco', txid, valor: p.valor, endToEndId: p.endToEndId });
            unmatched++;
          }
        }
      }
    }
  }
  return NextResponse.json({ totalLogs: logs.length, unmatched, issues });
}
