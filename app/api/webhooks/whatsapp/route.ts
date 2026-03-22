import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;


// Configurações W-API (Para enviar resposta)
const W_API_TOKEN = 'Swp2rYBaElQLSscDhTYWKQ9SnTLIVz9Sv';
const W_API_INSTANCE_ID = 'LITE-1VGFGA-OFBQ2X';

export async function POST(request: Request) {
  // Configurações SUPABASE (Admin para permitir updates)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const body = await request.json();
    console.log('[WHATSAPP WEBHOOK] Recebido:', body);

    // 1. Extrair a mensagem e o remetente
    const messageText = body.text?.message || body.message?.text || '';
    const sender = body.sender?.remoteJid || body.phone || '';
    
    // Log do evento para debug no Supabase
    await supabase.from('webhook_logs').insert({
      payload: body,
      source: 'whatsapp_webhook'
    });

    // 2. Tentar capturar Email e Nova Senha via Regex
    // Suporta: "Email: email@teste.com" e "Nova Senha: senha123" (com ou sem espaço extra)
    const emailMatch = messageText.match(/Email:\s*([^\s\n\r]+)/i);
    const senhaMatch = messageText.match(/Nova\s*Senha:\s*([^\s\n\r]+)/i);

    if (emailMatch && senhaMatch) {
      const email = emailMatch[1].trim();
      const novaSenha = senhaMatch[1].trim();

      console.log(`[WHATSAPP WEBHOOK] Comando detectado para: ${email}`);

      // 3. Validar se o email existe no sistema (status pending_reset)
      // Nota: Buscamos em credentials->>email
      const { data: account, error: findError } = await supabase
        .from('service_accounts')
        .select('id, credentials')
        .eq('credentials->>email', email)
        .single();

      if (findError || !account) {
        console.error('[WHATSAPP WEBHOOK] Email não encontrado:', email);
        await sendWhatsAppResponse(`❌ *ERRO:* O e-mail *${email}* não foi encontrado em nosso sistema de contas pendentes. Por favor, verifique se digitou corretamente.`, sender);
        return NextResponse.json({ success: false, error: 'Email not found' });
      }

      // 4. Se encontrou, atualizar a senha no JSONB e o status para available
      const newCredentials = { ...account.credentials, password: novaSenha };
      
      const { error: updateError } = await supabase
        .from('service_accounts')
        .update({
          credentials: newCredentials,
          status: 'available',
          expiry_notified: false // Resetar para permitir novo aviso no futuro
        })
        .eq('id', account.id);

      if (updateError) {
        console.error('[WHATSAPP WEBHOOK] Erro ao atualizar DB:', updateError);
        await sendWhatsAppResponse(`❌ *ERRO:* Falha ao atualizar o banco de dados. Tente novamente em instantes.`, sender);
        return NextResponse.json({ success: false, error: updateError.message });
      }

      // 5. Sucesso! Enviar confirmação
      console.log(`[WHATSAPP WEBHOOK] Sucesso! Conta ${email} atualizada.`);
      await sendWhatsAppResponse(`✅ *SUCESSO:* A senha da conta *${email}* foi atualizada e ela já está disponível para novos clientes!`, sender);
      
      return NextResponse.json({ success: true });
    }

    // Se não for um comando válido, apenas ignora
    return NextResponse.json({ success: true, ignored: true });

  } catch (error: any) {
    console.error('[WHATSAPP WEBHOOK ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function sendWhatsAppResponse(message: string, phone: string) {
  if (!phone) return;
  
  const url = `https://api.w-api.app/v1/message/send-text?instanceId=${W_API_INSTANCE_ID}`;
  
  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${W_API_TOKEN}`
      },
      body: JSON.stringify({
        phone: phone,
        message: message,
        delayMessage: 1
      })
    });
  } catch (error) {
    console.error('Error sending WhatsApp response:', error);
  }
}
