import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { efibank } from '@/lib/efibank';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    // Autentica o usuário logado (mesmo padrão do /api/card)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Usuário inválido ou sessão expirada' }, { status: 401 });
    }

    // Busca transações PIX pendentes desse usuário (cobranças dinâmicas Efí)
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const { data: pendingTxs, error: pendingError } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .eq('type', 'pix')
      .gte('created_at', fiveDaysAgo);

    if (pendingError) throw pendingError;

    const txids = (pendingTxs || [])
      .map((t: any) => t.external_id)
      .filter((id: string) => id && !id.startsWith('STATIC_') && !id.startsWith('pay_'));

    let credited = 0;
    const details = [];

    for (const txid of txids) {
      try {
        const cob = await efibank.consultarCobranca(txid) as any;
        const paid =
          cob?.status === 'CONCLUIDA' ||
          (Array.isArray(cob?.pix) && cob.pix.length > 0);

        if (!paid) {
          details.push({ txid, status: 'pending' });
          continue;
        }

        const { data: tx } = await supabaseAdmin
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .eq('external_id', txid)
          .maybeSingle();

        if (!tx || tx.status === 'success' || tx.status === 'approved') {
          details.push({ txid, status: tx?.status || 'not_found' });
          continue;
        }

        const endToEndId = cob?.pix?.[0]?.endToEndId || null;
        await supabaseAdmin.from('transactions')
          .update({ status: 'success', description: endToEndId || tx.description })
          .eq('id', tx.id);

        const { data: profile } = await supabaseAdmin
          .from('profiles').select('balance').eq('id', user.id).single();
        const newBalance = (profile?.balance || 0) + Number(tx.amount);
        await supabaseAdmin.from('profiles').update({ balance: newBalance }).eq('id', user.id);

        credited++;
        details.push({ txid, status: 'credited', amount: tx.amount });
      } catch (e: any) {
        details.push({ txid, status: 'error', reason: e.message });
      }
    }

    return NextResponse.json({ success: true, credited, checked: txids.length, details });
  } catch (error: any) {
    console.error('Erro no check-pending:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}