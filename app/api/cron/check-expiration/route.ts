import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

// CONFIGURAÇÕES W-API
const W_API_TOKEN = 'Swp2rYBaElQLSscDhTYWKQ9SnTLIVz9Sv';
const W_API_INSTANCE_ID = 'LITE-1VGFGA-OFBQ2X';
const WHATSAPP_NUMBER = '120363408498119601@g.us'; // Grupo ALERTA CONTA EXPIRADA

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    console.log('[CRON] Iniciando monitoramento de expirações...');

    // 1. Chamar o RPC que apenas LISTA contas expiradas (v2)
    const { data: alerts, error } = await supabase.rpc('get_expired_rentals_v2');

    if (error) {
      console.error('[CRON] RPC Error:', error);
      throw error;
    }

    let msgCount = 0;

    if (alerts && alerts.length > 0) {
      for (const alert of alerts) {
        let msg = '';
        if (alert.message_type === 'EXPIRED') {
          msg = `🚨 *Jackson & Israel GSM* 🚨\n\nA conta *${alert.email}* (${alert.service_title}) acaba de *EXPIRAR*!\n\n*Como Resetar:*\n1. Mude a senha no site original.\n2. Responda aqui assim:\nEmail: ${alert.email}\nNova Senha: [sua_nova_senha]`;
        } 

        if (msg) {
          console.log(`[CRON] Enviando alerta (${alert.message_type}) para ${alert.email}...`);
          const success = await sendWhatsApp(msg);
          
          if (success) {
            // SOMENTE marcar como notificado se o WhatsApp enviou com sucesso
            await supabase.rpc('mark_rental_notified', { p_rental_id: alert.account_id });
            msgCount++;
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: msgCount,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[CRON ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * Envia mensagem via W-API
 */
async function sendWhatsApp(message: string) {
  const url = `https://api.w-api.app/v1/message/send-text?instanceId=${W_API_INSTANCE_ID}`;
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${W_API_TOKEN}`
      },
      body: JSON.stringify({
        phone: WHATSAPP_NUMBER,
        message: message,
        delayMessage: 1
      })
    });

    const data = await res.json().catch(() => ({ error: 'Failed to parse JSON' }));
    
    // Logar resposta para debug no banco de dados (Usando supabaseAdmin via import acima)
    await supabase.from('webhook_logs').insert({
      source: 'cron_debug',
      payload: { 
        attempt: 'send_whatsapp', 
        target: WHATSAPP_NUMBER, 
        message_preview: message.substring(0, 50),
        status: res.status,
        response: data
      }
    });

    if (!res.ok) {
      console.error('W-API Error Response:', data);
      return false;
    }

    console.log('W-API Success:', data);
    return true;
  } catch (error: any) {
    console.error('Error sending WhatsApp:', error);
    // Logar erro crítico
    await supabase.from('webhook_logs').insert({
      source: 'cron_debug_error',
      payload: { error: error.message, stack: error.stack }
    });
    return false;
  }
}
