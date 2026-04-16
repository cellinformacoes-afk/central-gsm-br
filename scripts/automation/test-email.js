const { waitForCode } = require('./utils/email-reader');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

async function testEmail() {
    const email = 'cellinformacoes@gmail.com';
    const appPassword = process.env.GMAIL_APP_PASSWORD;
    
    if (!appPassword) {
        console.error("ERRO: GMAIL_APP_PASSWORD não configurado no arquivo .env");
        process.exit(1);
    }
    
    console.log(`Testando leitura de e-mail para: ${email}`);
    console.log("Aguardando código do UnlockPrice por 60 segundos...");
    
    const code = await waitForCode(email, appPassword, 60000);
    
    if (code) {
        console.log(`✅ SUCESSO! Código encontrado: ${code}`);
    } else {
        console.log("❌ Código não encontrado ou erro na conexão.");
    }
}

testEmail().catch(console.error);
