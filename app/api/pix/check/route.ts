import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

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

    // Com o Efí Bank (e também com outros gateways), a melhor estratégia de verificação
    // é checar o nosso próprio banco de dados, que é atualizado pelo webhook.
    const { data: tx, error } = await supabaseAdmin
      .from('transactions')
      .select('status, amount')
      .eq('external_id', paymentId)
      .eq('user_id', userId)
      .single();

    if (error || !tx) {
      return NextResponse.json({ status: 'pending' });
    }

    if (tx.status === 'success' || tx.status === 'approved') {
      return NextResponse.json({ 
        status: 'approved',
        amount: tx.amount
      });
    }

    return NextResponse.json({ status: tx.status });

  } catch (error: any) {
    console.error('Erro ao verificar pagamento:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
