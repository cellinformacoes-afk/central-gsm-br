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

    // 1. Rodar o monitor de expiração (RPC) para garantir que contas expiradas sejam detectadas no DB
    await supabase.rpc('monitor_rental_expiration');

    // 3. Buscar contas que expiraram e precisam de aviso final
    const { data: expiredAccounts, error: expiredError } = await supabase
      .from('service_accounts')
      .select('id, credentials, services(title)')
      .eq('status', 'pending_reset')
      .eq('expiry_notified', false);

    if (expiredError) throw expiredError;

    let msgCount = 0;

    // Processar Expirações Reais (Já venceu)
    if (expiredAccounts && expiredAccounts.length > 0) {
      for (const account of expiredAccounts) {
        const serviceTitle = (account as any).services?.title || 'Serviço';
        const email = account.credentials?.email || 'N/A';
        
        const msg = `🚨 *Jackson & Israel GSM* 🚨\n\nA conta *${email}* (${serviceTitle}) acaba de *EXPIRAR*!\n\n*Como Resetar:*\n1. Mude a senha no site original.\n2. Responda aqui assim:\nEmail: ${email}\nNova Senha: [sua_nova_senha]`;
        console.log(`[CRON] Enviando aviso de expiração para ${email}...`);
        await sendWhatsApp(msg);
        
        await supabase.from('service_accounts').update({ expiry_notified: true }).eq('id', account.id);
        msgCount++;
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
