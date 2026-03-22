import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// CONFIGURAÇÕES W-API
const W_API_TOKEN = 'Swp2rYBaElQLSscDhTYWKQ9SnTLIVz9Sv';
const W_API_INSTANCE_ID = 'LITE-1VGFGA-OFBQ2X';
const WHATSAPP_NUMBER = '120363408498119601@g.us'; // Grupo ALERTA CONTA EXPIRADA

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    console.log('[CRON] Iniciando monitoramento de expirações...');

    // 1. Chamar o RPC que faz tudo (Monitora, marca como expirado e retorna alertas pendentes)
    const { data: alerts, error } = await supabase.rpc('get_pending_whatsapp_alerts');

    if (error) throw error;

    let msgCount = 0;

    if (alerts && alerts.length > 0) {
      for (const alert of alerts) {
        let msg = '';
        if (alert.message_type === 'EXPIRED') {
          msg = `🚨 *Jackson & Israel GSM* 🚨\n\nA conta *${alert.email}* (${alert.service_title}) acaba de *EXPIRAR*!\n\n*Como Resetar:*\n1. Mude a senha no site original.\n2. Responda aqui assim:\nEmail: ${alert.email}\nNova Senha: [sua_nova_senha]`;
        } else if (alert.message_type === 'WARNING') {
          msg = `⚠️ *AVISO DE EXPIRAÇÃO* ⚠️\n\nA conta *${alert.email}* (${alert.service_title}) irá vencer em *10 MINUTOS*!`;
        }

        if (msg) {
          console.log(`[CRON] Enviando alerta (${alert.message_type}) para ${alert.email}...`);
          await sendWhatsApp(msg);
          msgCount++;
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: msgCount,
      timestamp: new Date().toISOString()
    });

  } catch (err: any) {
    console.error('[CRON ERROR]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

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
        delayMessage: 1 // Delay pequeno para automação
      })
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('W-API Error Response:', data);
      return false;
    }

    console.log('W-API Success:', data);
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp via W-API:', error);
    return false;
  }
}
