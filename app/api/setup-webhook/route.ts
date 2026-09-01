import { NextResponse } from 'next/server';
import { efibank } from '@/lib/efibank';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Primeiro, busca as chaves PIX cadastradas na conta
    const token = await efibank.getAuthToken();
    
    // Lista as chaves cadastradas
    const keysResponse = await fetch('https://pix.api.efipay.com.br/v2/gw/conta/chaves', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const keys = await keysResponse.json().catch(() => ({ error: 'Não foi possível listar as chaves' }));
    
    // Tenta configurar webhook com a chave PIX configurada
    let webhookResult = null;
    try {
      const webhookUrl = 'https://www.centralgsm.com.br/api/webhooks/efibank';
      webhookResult = await efibank.configurarWebhook(webhookUrl);
    } catch (e: any) {
      webhookResult = { error: e.message };
    }

    return NextResponse.json({ 
      chaves_pix_cadastradas: keys,
      webhook_resultado: webhookResult
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Erro desconhecido'
    }, { status: 500 });
  }
}
