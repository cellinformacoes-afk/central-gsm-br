const path = require('path');
const dotenv = require('dotenv');

// Carrega as chaves do .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const ASAAS_API_KEY = (process.env.ASAAS_API_KEY || '').trim();
const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://api.asaas.com/v3';

async function verifyAccount() {
    console.log("=== Verificação de Conta Asaas ===");
    console.log("URL:", ASAAS_API_URL);
    console.log("Key Length:", ASAAS_API_KEY.length);
    console.log("Key Prefix:", ASAAS_API_KEY.substring(0, 15));

    try {
        const response = await fetch(`${ASAAS_API_URL}/myAccount`, {
            headers: {
                'access_token': ASAAS_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log("✅ SUCESSO! A chave é válida.");
            console.log("Nome da Conta:", data.name);
            console.log("Email da Conta:", data.email);
            console.log("Status da Conta:", data.personType);
        } else {
            console.error("❌ ERRO DA API ASAAS:");
            console.error(JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error("❌ ERRO NA REQUISIÇÃO:", error.message);
    }
}

verifyAccount();
