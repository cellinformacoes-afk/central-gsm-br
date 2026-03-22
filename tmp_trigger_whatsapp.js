
const { createClient } = require('@supabase/supabase-js');

const NEXT_PUBLIC_SUPABASE_URL = 'https://cvzhczgvfvflmcwmmvlh.supabase.co';
const NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_MahwoOI84gjGojA2rtkf_g_B2NwxKan';
const CALLMEBOT_API_KEY = '2621335';
const ADMIN_PHONE = '5511961025492';

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function sendWhatsApp(message) {
  const url = `https://api.callmebot.com/whatsapp.php?phone=${ADMIN_PHONE}&text=${encodeURIComponent(message)}&apikey=${CALLMEBOT_API_KEY}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
        console.error('CallMeBot error:', await res.text());
        return false;
    }
    console.log('WhatsApp enviado com sucesso!');
    return true;
  } catch (e) {
    console.error('Fetch error sending WhatsApp:', e);
    return false;
  }
}

async function trigger() {
  console.log('Buscando contas expiradas...');
  
  // Primeiro, buscar a conta
  const { data: accounts, error: accError } = await supabase
    .from('service_accounts')
    .select('*')
    .eq('status', 'pending_reset')
    .eq('expiry_notified', false);

  if (accError) {
    console.error('Erro ao buscar contas:', accError);
    return;
  }

  console.log(`Contas encontradas no status pending_reset: ${accounts.length}`);

  for (const account of accounts) {
    // Buscar o título do serviço manualmente para garantir
    const { data: service } = await supabase
        .from('services')
        .select('title')
        .eq('id', account.service_id)
        .single();
        
    const serviceTitle = service?.title || 'Serviço';
    const email = account.credentials?.email || 'N/A';
    
    console.log(`Processando: ${email} (${serviceTitle})`);
    
    const msg = `🚨 *Jackson & Israel GSM* 🚨\n\nA conta *${email}* (${serviceTitle}) acaba de *EXPIRAR*! Favor realizar o reset manual na aba Expirados.`;
    
    const sent = await sendWhatsApp(msg);
    if (sent) {
      const { error: updateError } = await supabase
        .from('service_accounts')
        .update({ expiry_notified: true })
        .eq('id', account.id);
        
      if (updateError) {
        console.error('Erro ao atualizar banco:', updateError);
      } else {
        console.log(`Notificado e atualizado: ${email}`);
      }
    }
  }
}

trigger();
