import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// CONFIGURAÇÕES W-API
const W_API_TOKEN = 'Swp2rYBaElQLSscDhTYWKQ9SnTLIVz9Sv';
const W_API_INSTANCE_ID = 'LITE-1VGFGA-OFBQ2X';

export async function POST(request: Request) {
  const debug: any = { 
    timestamp: new Date().toISOString(),
    step: 'start'
  };
  let body: any = {};

  try {
    // 0. Ler o corpo da requisição
    body = await request.json();
    debug.payload = body;
    debug.step = 'payload_received';

    // 1. Extrair informações básicas do payload da W-API
    const chatId = body.chat?.id || body.sender?.id || body.sender?.remoteJid || body.phone || '';
    const messageText = body.msgContent?.conversation || body.text?.message || body.msgContent?.text || '';
    
    debug.chatId = chatId;
    debug.messageText = messageText;

    if (!messageText) {
      debug.step = 'no_message_text';
      await logToDatabase(body, debug);
      return NextResponse.json({ success: true, ignored: true });
    }

    // 2. Tentar capturar Email e Nova Senha via Regex
    // Agora aceita tanto ":" quanto espaço como separador
    const emailMatch = messageText.match(/Email\s*[:\s]\s*([^\s\n\r]+)/i);
    const senhaMatch = messageText.match(/Nova\s*Senha\s*[:\s]\s*([^\s\n\r]+)/i);

    debug.emailMatch = !!emailMatch;
    debug.senhaMatch = !!senhaMatch;

    if (emailMatch && senhaMatch) {
      debug.step = 'matches_found';
      const email = emailMatch[1].trim();
      const novaSenha = senhaMatch[1].trim().replace(/^\[|\]$/g, '');
      
      debug.capturedEmail = email;
      debug.capturedSenha = novaSenha;

      // 3. Validar se o email existe no sistema usando supabaseAdmin
      const { data: account, error: findError } = await supabaseAdmin
        .from('service_accounts')
        .select('id, credentials, status')
        .eq('credentials->>email', email)
        .single();
      
      debug.foundAccount = !!account;
      debug.findError = findError;
      debug.accountStatus = account?.status;

      if (findError || !account) {
        debug.step = 'account_not_found';
        await sendWhatsAppResponse(`❌ *ERRO:* O e-mail *${email}* não foi encontrado nos registros de contas pendentes.`, chatId);
      } else {
        debug.step = 'account_found_updating';
        // 4. Atualizar a senha e o status
        const newCredentials = { ...account.credentials, password: novaSenha };
        
        const { error: updateError } = await supabaseAdmin
          .from('service_accounts')
          .update({
            credentials: newCredentials,
            status: 'available',
            expiry_notified: false
          })
          .eq('id', account.id);

        debug.updateError = updateError;

        if (updateError) {
          debug.step = 'update_error';
          await sendWhatsAppResponse(`❌ *ERRO:* Falha ao atualizar o banco de dados para *${email}*.`, chatId);
        } else {
          debug.step = 'success';
          await sendWhatsAppResponse(`✅ *SUCESSO:* A senha da conta *${email}* foi atualizada com sucesso para *${novaSenha}* e ela já está disponível no site!`, chatId);
        }
      }
    } else {
      debug.step = 'not_a_command';
    }

    // Log final único
    await logToDatabase(body, debug);
    return NextResponse.json({ success: true, debug });

  } catch (error: any) {
    console.error('[WHATSAPP WEBHOOK ERROR]', error);
    debug.error = error.message;
    debug.stack = error.stack;
    await logToDatabase(body, debug);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * Função auxiliar para logar no banco de dados com segurança
 */
async function logToDatabase(payload: any, debug: any) {
  try {
    await supabaseAdmin.from('webhook_logs').insert({
      payload: payload,
      source: 'whatsapp_webhook',
      headers: debug
    });
  } catch (e) {
    console.error('Falha crítica ao logar no DB:', e);
  }
}

/**
 * Envia uma mensagem de texto de volta via W-API
 */
async function sendWhatsAppResponse(message: string, chatId: string) {
  if (!chatId) return;
  
  const url = `https://api.w-api.app/v1/message/send-text?instanceId=${W_API_INSTANCE_ID}`;
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${W_API_TOKEN}`
      },
      body: JSON.stringify({
        phone: chatId,
        message: message,
        delayMessage: 1
      })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error('W-API Error Response:', data);
    }
  } catch (error) {
    console.error('Error sending WhatsApp response:', error);
  }
}
