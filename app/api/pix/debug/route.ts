import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const asaasUrl = process.env.ASAAS_API_URL || 'https://api.asaas.com/v3';
    const asaasKey = process.env.ASAAS_API_KEY || '';

    // Buscar pix/transactions
    const pixRes = await fetch(`${asaasUrl}/pix/transactions?limit=5`, {
      headers: { 'access_token': asaasKey.trim() }
    });
    const pixData = await pixRes.json();

    // Buscar financialTransactions
    const finRes = await fetch(`${asaasUrl}/financialTransactions?limit=5`, {
      headers: { 'access_token': asaasKey.trim() }
    });
    const finData = await finRes.json();

    // Retornar os campos de cada transação (para ver os nomes reais dos campos)
    const pixSample = (pixData.data || []).slice(0, 3).map((t: any) => ({
      id: t.id,
      type: t.type,
      status: t.status,
      value: t.value,
      netValue: t.netValue,
      // Campos de data possíveis
      date: t.date,
      dateCreated: t.dateCreated,
      effectiveDate: t.effectiveDate,
      paymentDate: t.paymentDate,
      // Campos de pagador
      payer_name: t.payer?.name,
      payer_cpf: t.payer?.cpfCnpj,
      description: t.description,
      // Todos os campos raw
      _raw_keys: Object.keys(t),
    }));

    const finSample = (finData.data || []).slice(0, 3).map((t: any) => ({
      id: t.id,
      type: t.type,
      value: t.value,
      date: t.date,
      dateCreated: t.dateCreated,
      description: t.description,
      _raw_keys: Object.keys(t),
    }));

    return NextResponse.json({
      pix_transactions: {
        total: pixData.totalCount,
        sample: pixSample,
      },
      financial_transactions: {
        total: finData.totalCount,
        sample: finSample,
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
