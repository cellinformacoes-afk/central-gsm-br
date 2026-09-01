import { NextResponse } from 'next/server';
import { efibank } from '@/lib/efibank';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Lista as chaves PIX cadastradas na conta (usando mTLS)
    let chaves: any[] = [];
    let chavesErro = null;
    try {
      const res = await efibank.listarChavesPix() as any;
      chaves = res?.chaves || [];
    } catch (e: any) {
      chavesErro = e.message;
    }

    // Tenta configurar webhook para cada chave encontrada
    const webhookUrl = 'https://www.centralgsm.com.br/api/webhooks/efibank';
    const resultados: any[] = [];

    if (chaves.length > 0) {
      for (const chave of chaves) {
        const chaveValor = chave.chave || chave;
        try {
          await efibank.configurarWebhook(webhookUrl, chaveValor);
          resultados.push({ chave: chaveValor, status: '✅ Webhook configurado!' });
        } catch (e: any) {
          resultados.push({ chave: chaveValor, status: `❌ ${e.message}` });
        }
      }
    }

    return NextResponse.json({ 
      chaves_encontradas: chaves,
      chaves_erro: chavesErro,
      webhook_resultados: resultados,
      nota: chaves.length === 0 ? 'Nenhuma chave PIX encontrada na conta Efí. Cadastre uma chave PIX no app/site da Efí Bank.' : `${chaves.length} chave(s) encontrada(s)`
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Erro desconhecido'
    }, { status: 500 });
  }
}
