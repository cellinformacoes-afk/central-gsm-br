const path = require('path');
const dotenv = require('dotenv');

// Carrega as chaves do .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '';
const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://api.asaas.com/v3';

async function testKey() {
    console.log("=== Teste de Chave Asaas ===");
    console.log("URL:", ASAAS_API_URL);
    console.log("Tamanho da Key:", ASAAS_API_KEY.length);
    console.log("Key começa com:", ASAAS_API_KEY.substring(0, 10));

    try {
        const response = await fetch(`${ASAAS_API_URL}/customers?limit=1`, {
            headers: {
                'access_token': ASAAS_API_KEY.trim(),
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log("✅ SUCESSO! A chave é válida e o Asaas respondeu corretamente.");
            console.log("Total de clientes encontrados:", data.totalCount);
        } else {
            console.error("❌ ERRO DA API ASAAS:");
            console.error(JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error("❌ ERRO NA REQUISIÇÃO:", error.message);
    }
}

testKey();
