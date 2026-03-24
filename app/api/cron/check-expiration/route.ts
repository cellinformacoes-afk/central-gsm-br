import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

// CONFIGURAÇÕES W-API
const W_API_TOKEN = 'Swp2rYBaElQLSscDhTYWKQ9SnTLIVz9Sv';
const W_API_INSTANCE_ID = 'LITE-1VGFGA-OFBQ2X';
const GROUP_ID = '120363408498119601@g.us'; // Grupo ALERTA CONTA EXPIRADA
const ADMIN_NUMBER = '5511961025492'; // Número do Israel para teste de entrega

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
          msg = `🚨 *ALERTA JACKSON & ISRAEL GSM* 🚨\n\nA conta *${alert.email}* (${alert.service_title}) acaba de *EXPIRAR*!\n\n*Como Resetar:*\n1. Mude a senha no site original.\n2. Responda aqui assim:\nEmail: ${alert.email}\nNova Senha: [sua_nova_senha]`;
        } 

        if (msg) {
          console.log(`[CRON] Enviando alerta para ${alert.email}...`);
          
          // Enviar para o GRUPO
          const successGroup = await sendWhatsApp(GROUP_ID, msg);
          
          // Enviar duplicata para o ADMIN (Teste de entrega)
          const successAdmin = await sendWhatsApp(ADMIN_NUMBER, `*CÓPIA DE SEGURANÇA (GRUPO):*\n\n${msg}`);
          
          if (successGroup || successAdmin) {
            // Se pelo menos um tentou com sucesso (API 200), marcamos como notificado para não repetir INFINITAMENTE
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
        delayMessage: 1 // Mantendo o delay padrão
      })
    });

    const data = await res.json().catch(() => ({}));

    // Logar no banco para vermos se foi 200 ou erro
    await supabase.from('webhook_logs').insert({
      source: 'cron_debug_final',
      payload: { to, status: res.status, response: data, message: message.substring(0, 50) }
    });

    if (!res.ok) {
      console.error(`W-API Error (${to}):`, data);
      return false;
    }

    return true;
  } catch (error: any) {
    console.error(`Error sending to ${to}:`, error);
    return false;
  }
}
