const W_API_TOKEN = process.env.W_API_TOKEN || 'Swp2rYBaElQLSscDhTYWKQ9SnTLIVz9Sv';
const W_API_INSTANCE_ID = process.env.W_API_INSTANCE_ID || 'LITE-1VGFGA-OFBQ2X';
const ADMIN_PHONE = process.env.ADMIN_PHONE || '5585985573558'; // WhatsApp do admin

/**
 * Envia mensagem de alerta pro WhatsApp do admin
 */
async function alertarAdmin(mensagem) {
  const url = `https://api.w-api.app/v1/message/send-text?instanceId=${W_API_INSTANCE_ID}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${W_API_TOKEN}`
      },
      body: JSON.stringify({
        phone: ADMIN_PHONE,
        message: mensagem,
        delayMessage: 1
      })
    });
    if (!res.ok) {
      console.error('[WhatsApp] Falha ao enviar alerta:', await res.text());
    }
  } catch (err) {
    console.error('[WhatsApp] Erro de conexão:', err.message);
  }
}

module.exports = { alertarAdmin };
