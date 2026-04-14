const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);
const path = require('path');
const fs = require('fs');

async function setupSessions() {
    console.log("\n======================================================");
    console.log("   FERRAMENTA DE LOGIN ÚNICO (BYPASS CLOUDFLARE)   ");
    console.log("======================================================\n");
    console.log("Este script abrirá os sites oficiais. Você deve:");
    console.log("1. Fazer o login manualmente em cada um.");
    console.log("2. Resolver qualquer desafio 'Sou Humano' (Captcha).");
    console.log("3. Assim que estiver logado no painel, feche o navegador.");
    console.log("\nA partir daí, o robô usará sua sessão salva e será 100% AUTOMÁTICO!\n");

    const sessionDir = path.join(__dirname, 'automation', 'sync_browser_data');
    if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
    }

    const browser = await chromium.launchPersistentContext(sessionDir, {
        headless: false,
        channel: 'chrome',
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-blink-features=AutomationControlled',
            '--exclude-switches', 'enable-automation'
        ],
        ignoreDefaultArgs: ['--enable-automation'],
        viewport: null // DEIXA O TAMANHO NATURAL DA JANELA
    }).catch(async () => {
        return await chromium.launchPersistentContext(sessionDir, {
            headless: false,
            channel: 'msedge',
            args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
            ignoreDefaultArgs: ['--enable-automation'],
            viewport: null
        });
    });

    // Super Stealth Script
    await browser.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        Object.defineProperty(navigator, 'languages', { get: () => ['pt-BR', 'pt'] });
        Object.defineProperty(navigator, 'platform', { get: () => 'Win32' });
        window.chrome = { runtime: {} };
    });

    const pages = await browser.pages();
    const page = pages.length > 0 ? pages[0] : await browser.newPage();
    
    console.log("\n-> Abrindo UNLOCK TOOL (URL post-in)...");
    // URL atualizada para evitar 404
    await page.goto('https://unlocktool.net/post-in/', { waitUntil: 'domcontentloaded' }).catch(() => {});
    
    console.log("\n[AGUARDANDO] Faça o login no site que abriu e resolva o Captcha.");
    console.log("Se ainda der erro, tente abrir o site em uma nova Guia Anônima dentro desse navegador que abriu.");

    const page2 = await browser.newPage();
    console.log("-> Abrindo ANDROID MULTI TOOL...");
    await page2.goto('https://androidmultitool.com/controller/login', { waitUntil: 'domcontentloaded' }).catch(() => {});

    const page3 = await browser.newPage();
    console.log("-> Abrindo TSM TOOL...");
    await page3.goto('https://tsm-tool.com/login').catch(() => {});

    const page4 = await browser.newPage();
    console.log("-> Abrindo TFM TOOL...");
    await page4.goto('https://tfmtool.com/login').catch(() => {});

    browser.on('close', () => {
        console.log("\n✅ Sessões salvas com sucesso! Agora o robô está pronto.");
        process.exit(0);
    });
}

setupSessions().catch(err => {
    console.error("Erro Fatal:", err);
    process.exit(1);
});
