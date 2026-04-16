import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

// CONFIGURAÇÕES W-API
const W_API_TOKEN = 'Swp2rYBaElQLSscDhTYWKQ9SnTLIVz9Sv';
const W_API_INSTANCE_ID = 'LITE-1VGFGA-OFBQ2X';
const GROUP_ID = '120363408498119601@g.us'; // Grupo ALERTA CONTA EXPIRADA

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    console.log('[CRON] Iniciando monitoramento de expirações...');

    // 1. Chamar o RPC que processa expirações e cria tarefas de automação
    const { data: result, error } = await supabase.rpc('monitor_rental_expiration_v3');

    if (error) {
      console.error('[CRON] RPC Error:', error);
      throw error;
    }

    const { expiredCount } = result as { expiredCount: number };

    if (expiredCount > 0) {
      const msg = `🚨 *Central GSM - Automação* 🚨\n\nProcessadas *${expiredCount}* expirações.\nTarefas de reset de senha criadas e enviadas para o Worker.`;
      await sendWhatsApp(GROUP_ID, msg);
    }

    return NextResponse.json({ 
      success: true, 
      processed: expiredCount,
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
async function sendWhatsApp(to: string, message: string) {
  const url = `https://api.w-api.app/v1/message/send-text?instanceId=${W_API_INSTANCE_ID}`;
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${W_API_TOKEN}`
      },
      body: JSON.stringify({
        phone: to,
        message: message,
        delayMessage: 1
      })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error(`W-API Error (${to}):`, data);
      return false;
    }

    return true;
  } catch (error: any) {
    console.error(`Error sending to ${to}:`, error);
    return false;
  }
}
