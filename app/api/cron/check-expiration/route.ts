import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// CONFIGURAÇÕES CALLMEBOT
const CALLMEBOT_API_KEY = '2621335';
const ADMIN_PHONE = '5511961025492';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    console.log('[CRON] Iniciando monitoramento de expirações...');

    // 1. Rodar o monitor de expiração (RPC) para garantir que contas expiradas sejam detectadas no DB
    await supabase.rpc('monitor_rental_expiration');

    const now = new Date();
    
    // Janela de "10 minutos faltando" (entre 2 e 15 minutos do agora)
    const tenMinMin = new Date(now.getTime() + 2 * 60000).toISOString();
    const tenMinMax = new Date(now.getTime() + 15 * 60000).toISOString();

    // 2. Buscar aluguéis ativos para o aviso de 10 minutos
    const { data: warningRentals, error: warningError } = await supabase
      .from('rentals')
      .select('id, expires_at, credentials, order_id')
      .eq('is_active', true)
      .eq('warning_sent', false)
      .gte('expires_at', tenMinMin)
      .lte('expires_at', tenMinMax);

    if (warningError) throw warningError;

    // 3. Buscar contas que expiraram e precisam de aviso final
    const { data: expiredAccounts, error: expiredError } = await supabase
      .from('service_accounts')
      .select('id, credentials, services(title)')
      .eq('status', 'pending_reset')
      .eq('expiry_notified', false);

    if (expiredError) throw expiredError;

    let msgCount = 0;

    // Processar Avisos Prévios (10 min antes)
    if (warningRentals && warningRentals.length > 0) {
      for (const rental of warningRentals) {
        // Buscar o nome do serviço
        const { data: orderData } = await supabase
          .from('orders')
          .select('services(title)')
          .eq('id', rental.order_id)
          .single();
        
        const serviceTitle = (orderData as any)?.services?.title || 'Serviço';
        const email = rental.credentials?.email || 'N/A';
        
        const msg = `⚠️ *Jackson & Israel GSM* ⚠️\n\nA conta *${email}* (${serviceTitle}) vence em aproximadamente *10 MINUTOS*!`;
        await sendWhatsApp(msg);
        
        await supabase.from('rentals').update({ warning_sent: true }).eq('id', rental.id);
        msgCount++;
      }
    }

    // Processar Expirações Reais (Já venceu)
    if (expiredAccounts && expiredAccounts.length > 0) {
      for (const account of expiredAccounts) {
        const serviceTitle = (account as any).services?.title || 'Serviço';
        const email = account.credentials?.email || 'N/A';
        
        const msg = `🚨 *Jackson & Israel GSM* 🚨\n\nA conta *${email}* (${serviceTitle}) acaba de *EXPIRAR*! Favor realizar o reset manual na aba Expirados.`;
        await sendWhatsApp(msg);
        
        await supabase.from('service_accounts').update({ expiry_notified: true }).eq('id', account.id);
        msgCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: msgCount,
      timestamp: now.toISOString()
    });

  } catch (err: any) {
    console.error('[CRON ERROR]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

async function sendWhatsApp(message: string) {
  const url = `https://api.callmebot.com/whatsapp.php?phone=${ADMIN_PHONE}&text=${encodeURIComponent(message)}&apikey=${CALLMEBOT_API_KEY}`;
  try {
    const res = await fetch(url);
    if (!res.ok) console.error('CallMeBot error:', await res.text());
  } catch (e) {
    console.error('Fetch error sending WhatsApp:', e);
  }
}
