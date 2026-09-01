import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { efibank } from '@/lib/efibank';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('id'); // txid ou external_id
    const userId = searchParams.get('userId');

    if (!paymentId || !userId) {
      return NextResponse.json({ error: 'ID do pagamento ou do usuário faltando' }, { status: 400 });
    }

    // Busca a transação pendente no banco
    let tx: any = null;
    const { data: txData } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('external_id', paymentId)
      .eq('user_id', userId)
      .maybeSingle();
    tx = txData;

    // Fallback: consulta o status real da cobrança na Efí Bank
    let cobPago = false;
    let cobAmount = 0;
    try {
      const cob = await efibank.consultarCobranca(paymentId) as any;
      const pago = cob?.status === 'CONCLUIDA' || (Array.isArray(cob?.pix) && cob.pix.length > 0);
      if (pago) {
        cobPago = true;
        cobAmount = parseFloat(cob.valor?.original || '0');
      }
    } catch (e: any) {
      console.error('Erro ao consultar cobrança na Efí no check:', e.message);
    }

    // Se já está creditado no banco, retorna approved
    if (tx && (tx.status === 'success' || tx.status === 'approved')) {
      return NextResponse.json({ status: 'approved', amount: tx.amount });
    }

    // Se pago na Efí mas ainda não processado no banco, credita o saldo (mesma lógica do webhook)
    if (cobPago) {
      let amountParaCreditar = cobAmount;
      if (tx && tx.status === 'pending') {
        await supabaseAdmin.from('transactions').update({ status: 'success' }).eq('id', tx.id);
        amountParaCreditar = tx.amount;
      } else if (!tx) {
        const { data: novo } = await supabaseAdmin.from('transactions').insert({
          user_id: userId,
          amount: cobAmount,
          status: 'success',
          external_id: paymentId,
          type: 'pix'
        }).select().single();
        if (novo) tx = novo;
      }

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('balance')
        .eq('id', userId)
        .single();

      const newBalance = (profile?.balance || 0) + amountParaCreditar;
      await supabaseAdmin.from('profiles').update({ balance: newBalance }).eq('id', userId);

      return NextResponse.json({ status: 'approved', amount: amountParaCreditar });
    }

    return NextResponse.json({ status: tx?.status || 'pending' });

  } catch (error: any) {
    console.error('Erro ao verificar pagamento:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
