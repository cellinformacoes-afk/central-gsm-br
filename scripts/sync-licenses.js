require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: 'scripts/automation/.env' });

const { createClient } = require('@supabase/supabase-js');
const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
const drivers = require('./automation/drivers');

chromium.use(stealth);

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function syncAllLicenses() {
    console.log("🚀 Iniciando Sincronização em Massa (VIA REUSO DE ABAS CDP)...");

    const { data: accounts, error: fetchError } = await supabase
        .from('service_accounts')
        .select(`id, credentials, services ( title )`)
        .order('id', { ascending: true });

    if (fetchError) {
        console.error("❌ Erro ao buscar contas:", fetchError.message);
        return;
    }

    let browser;
    try {
        console.log("📡 Conectando ao Chrome (localhost:9222)...");
        browser = await chromium.connectOverCDP('http://localhost:9222');
    } catch (e) {
        console.error("\n❌ ERRO: Não consegui conectar ao Chrome.");
        console.error("👉 CERTIFIQUE-SE DE QUE O 'scripts/login_manual.bat' ESTÁ ABERTO!");
        return;
    }

    const context = browser.contexts()[0];
    const results = { success: 0, failed: 0, skipped: 0 };

    for (const acc of accounts) {
        const serviceTitle = acc.services?.title || "Desconhecido";
        const email = acc.credentials?.email || acc.credentials?.username;
        const pass = acc.credentials?.password;

        if (!email || !pass) {
            results.skipped++;
            continue;
        }

        const driver = drivers.getDriver(serviceTitle);
        if (!driver) {
            results.skipped++;
            continue;
        }

        console.log(`\n[${serviceTitle}] Sincronizando ${email}...`);

        try {
            // PROCURA ABA JÁ ABERTA DO SERVIÇO
            const pages = context.pages();
            let targetPage = pages.find(p => p.url().includes(serviceTitle.toLowerCase().replace(" ", "")) || 
                                           p.url().includes(serviceTitle.split(" ")[0].toLowerCase()));
            
            if (!targetPage) {
                console.log(`   🌐 Abrindo nova aba para ${serviceTitle}...`);
                targetPage = await context.newPage();
            } else {
                console.log(`   ♻️  Usando aba existente: ${targetPage.url().substring(0, 40)}...`);
                await targetPage.bringToFront();
            }

            const result = await driver.resetPassword(targetPage, email, pass, null, null, true);
            
            if (result && result.success && result.license_expires_at) {
                console.log(`   ✅ Sincronizado: ${result.license_expires_at}`);
                await supabase
                    .from('service_accounts')
                    .update({ 
                        license_expires_at: result.license_expires_at,
                        last_sync_at: new Date().toISOString()
                    })
                    .eq('id', acc.id);
                results.success++;
            } else {
                console.log(`   ❌ Falha: Não logado ou captcha bloqueando.`);
                results.failed++;
            }
        } catch (e) {
            console.log(`   🚨 Erro: ${e.message}`);
            results.failed++;
        }
        await new Promise(r => setTimeout(r, 2000));
    }

    console.log("\n======================================================");
    console.log(`🏁 Fim: ${results.success} sincronizados.`);
    console.log("======================================================");
}

syncAllLicenses().catch(err => console.error(err));
