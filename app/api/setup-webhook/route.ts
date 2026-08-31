import { NextResponse } from 'next/server';
import { efibank } from '@/lib/efibank';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // A URL que queremos registrar
    const webhookUrl = 'https://www.centralgsm.com.br/api/webhooks/efibank';
    
    // Chama o método que acabamos de criar na lib/efibank.ts
    const result = await efibank.configurarWebhook(webhookUrl);

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook configurado com sucesso na Efí Bank!',
      result: result
    });
  } catch (error: any) {
    console.error('Erro ao configurar webhook:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Erro desconhecido'
    }, { status: 500 });
  }
}
