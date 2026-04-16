const { createClient } = require('@supabase/supabase-js');
const { chromium } = require('playwright');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });
dotenv.config({ path: path.join(__dirname, 'automation/.env') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function debugAMT() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Busca todas as contas e filtra aqui no JS para evitar problemas de sitaxe de query jsonb
    const { data: accounts } = await supabase.from('service_accounts').select('*');
    const acc = accounts.find(a => a.credentials.email === 'centralgsm2026@gmail.com');
    
    if (!acc) {
        console.log("Conta centralgsm2026@gmail.com não encontrada no DB.");
        console.log("Emails disponíveis:", accounts.map(a => a.credentials.email).join(', '));
        await browser.close();
        return;
    }

    console.log(`Tentando logar em ${acc.credentials.email}...`);
    await page.goto('https://androidmultitool.com/controller/login');
    await page.fill('#email', acc.credentials.email);
    await page.fill('#password', acc.credentials.password);
    await page.click('button.btn-primary');
    await page.waitForTimeout(10000);

    if (page.url().includes('login')) {
        console.log("Falha no login.");
    } else {
        console.log("Logado! Indo para account...");
        await page.goto('https://androidmultitool.com/controller/account/');
        await page.waitForTimeout(5000);
        
        await page.screenshot({ path: path.join(__dirname, 'amt_debug.png'), fullPage: true });
        console.log("Screenshot salva em scripts/amt_debug.png");

        const bodyContent = await page.innerText('body');
        console.log("--- CONTEÚDO DA PÁGINA ---");
        // Filtra linhas que contenham datas ou palavras chave para não poluir muito
        const lines = bodyContent.split('\n').filter(l => l.includes('Expiry') || l.includes('Date') || l.includes('20') || l.includes('Mar') || l.includes('Apr') || l.includes('May'));
        console.log(lines.join('\n'));
        console.log("--------------------------");
    }

    await browser.close();
}

debugAMT();
