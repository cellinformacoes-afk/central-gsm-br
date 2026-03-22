
const CALLMEBOT_API_KEY = '2621335';
const ADMIN_PHONE = '5511961025492';

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

const email = 'cellinformacoes@gmail.com';
const serviceTitle = 'fddfds';
const msg = `🚨 *Jackson & Israel GSM* 🚨\n\nA conta *${email}* (${serviceTitle}) acaba de *EXPIRAR*! Favor realizar o reset manual na aba Expirados.`;

sendWhatsApp(msg);
