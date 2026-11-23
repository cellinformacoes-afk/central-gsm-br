import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { efibank } from '@/lib/efibank';
import { asaas } from '@/lib/asaas';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('id'); // txid ou external_id (ex: pay_... no Asaas)
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

    // Se já está aprovado no banco, retorna approved
    if (tx && (tx.status === 'success' || tx.status === 'approved')) {
      return NextResponse.json({ status: 'approved', amount: tx.amount });
    }

    let isApproved = false;
    let amountToCredit = tx?.amount || 0;

    // 1. Se for Asaas (IDs do Asaas começam com 'pay_')
    if (paymentId.startsWith('pay_')) {
      try {
        const asaasStatus = await asaas.getPaymentStatus(paymentId);
        if (asaasStatus === 'approved') {
          isApproved = true;
        }
      } catch (err: any) {
        console.error('Erro ao consultar status no Asaas:', err.message);
      }
    } 
    // 2. Se for Efí Bank
    else {
      try {
        const cob = await efibank.consultarCobranca(paymentId) as any;
        const pago = cob?.status === 'CONCLUIDA' || (Array.isArray(cob?.pix) && cob.pix.length > 0);
        if (pago) {
          isApproved = true;
          if (!amountToCredit) {
            amountToCredit = parseFloat(cob.valor?.original || '0');
          }
        }
      } catch (e: any) {
        console.error('Erro ao consultar cobrança na Efí:', e.message);
      }
    }

    // Se confirmado pelo banco e ainda não creditado, processa o crédito
    if (isApproved && amountToCredit > 0) {
      if (tx && tx.status === 'pending') {
        await supabaseAdmin.from('transactions').update({ status: 'success' }).eq('id', tx.id);
      } else if (!tx) {
        const { data: novo } = await supabaseAdmin.from('transactions').insert({
          user_id: userId,
          amount: amountToCredit,
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

      const newBalance = (profile?.balance || 0) + amountToCredit;
      await supabaseAdmin.from('profiles').update({ balance: newBalance }).eq('id', userId);

      console.log(`[CHECK] Pagamento ${paymentId} confirmado e creditado: R$ ${amountToCredit} para user ${userId}`);
      return NextResponse.json({ status: 'approved', amount: amountToCredit });
    }

    return NextResponse.json({ status: tx?.status || 'pending' });

  } catch (error: any) {
    console.error('Erro ao verificar pagamento:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
