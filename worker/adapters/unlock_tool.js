/**
 * Adaptador: Unlock Tool (unlocktool.net)
 *
 * Fluxo:
 * 1. Login em /post-in/ com usuário e senha antiga
 * 2. Navega para /password-change/
 * 3. Preenche os 3 campos (antiga, nova, confirmar)
 * 4. Submete e verifica confirmação
 *
 * Cloudflare: aguarda até 90s para o challenge passar antes de interagir
 */

const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
const { log } = require('../lib/logger');

chromium.use(stealth);

const LOGIN_URL  = 'https://unlocktool.net/post-in/';
const CHANGE_URL = 'https://unlocktool.net/password-change/';
const TIMEOUT_MS = 90000; // 90s para Cloudflare

// Aguarda o formulário de login aparecer (Cloudflare pode demorar)
async function aguardarFormLogin(page) {
  const seletores = [
    'input[name="username"]',
    'input[type="text"]',
    'input[id*="user"]',
    'input[placeholder*="user" i]',
    'input[placeholder*="login" i]'
  ];
  for (const sel of seletores) {
    try {
      await page.waitForSelector(sel, { timeout: 15000 });
      return sel;
    } catch (_) { /* tenta próximo */ }
  }
  return null;
}

async function resetarSenha({ username, senhaAntiga, senhaNova }) {
  log('ROBO', `Unlock Tool → iniciando para usuário: ${username}`);

  // Proxy residencial para passar Cloudflare (configurar via variáveis de ambiente)
  const proxyServer   = process.env.PROXY_SERVER;   // ex: http://12.34.56.78:8080
  const proxyUsername = process.env.PROXY_USER;
  const proxyPassword = process.env.PROXY_PASS;

  const launchOptions = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled'
    ]
  };

  if (proxyServer) {
    // Embute credenciais na URL do proxy: http://user:pass@host:port
    let proxyUrl = proxyServer;
    if (proxyUsername && !proxyServer.includes('@')) {
      proxyUrl = proxyServer.replace('http://', `http://${proxyUsername}:${proxyPassword}@`);
    }
    launchOptions.proxy = {
      server: proxyUrl,
      username: proxyUsername || undefined,
      password: proxyPassword || undefined
    };
    log('ROBO', `Unlock Tool → usando proxy (credenciais embutidas)`);
  } else {
    log('AVISO', 'Unlock Tool → sem proxy configurado (pode falhar no Cloudflare)');
  }

  const browser = await chromium.launch(launchOptions);

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  });

  // Bloqueia imagens, fontes e CSS para economizar ~70% de banda do proxy
  const page = await context.newPage();
  await page.route('**/*', (route) => {
    const type = route.request().resourceType();
    if (['image', 'font', 'stylesheet', 'media'].includes(type)) {
      route.abort();
    } else {
      route.continue();
    }
  });


  try {
    // ── PASSO 1: Login ──────────────────────────────────────────
    log('ROBO', 'Unlock Tool → acessando página de login (aguardando Cloudflare)...');
    await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    // Aguarda Cloudflare processar o challenge (ele redireciona após ~5s)
    await page.waitForTimeout(8000);

    // Aguarda formulário de login (Cloudflare pode demorar até 30s)
    const seletorUsuario = await aguardarFormLogin(page);
    if (!seletorUsuario) {
      const html = (await page.content()).substring(0, 500);
      log('AVISO', `Unlock Tool → HTML da pagina: ${html}`);
      return { ok: false, motivo: 'Formulário de login não apareceu — Cloudflare bloqueou ou página mudou', intervencao: true };
    }

    log('ROBO', `Unlock Tool → formulário encontrado (${seletorUsuario}), preenchendo...`);
    await page.fill(seletorUsuario, username);

    const camposSenha = await page.$$('input[type="password"]');
    if (camposSenha.length === 0) {
      return { ok: false, motivo: 'Campo de senha não encontrado na página de login', intervencao: true };
    }
    await camposSenha[0].fill(senhaAntiga);

    // Clica no botão de login
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, input[type="submit"]'));
      const btn = btns.find(b => {
        const txt = (b.textContent || b.value || '').toLowerCase();
        return txt.includes('login') || txt.includes('entrar') || txt.includes('sign') || txt.includes('conect');
      });
      if (btn) btn.click();
    });

    log('ROBO', 'Unlock Tool → login enviado, aguardando resposta (12s)...');
    await page.waitForTimeout(12000);

    // Verifica se o login funcionou (não voltou para a página de login)
    const urlAtual = page.url();
    if (urlAtual.includes('post-in') || urlAtual.includes('login')) {
      return { ok: false, motivo: 'Login falhou — senha antiga incorreta ou CAPTCHA bloqueou', intervencao: true };
    }

    // ── PASSO 2: Trocar senha ──────────────────────────────────
    log('ROBO', 'Unlock Tool → login OK! Acessando página de troca de senha...');
    await page.goto(CHANGE_URL, { waitUntil: 'load', timeout: TIMEOUT_MS });
    await page.waitForTimeout(3000);

    const campos = await page.$$('input[type="password"]');
    if (campos.length < 3) {
      return { ok: false, motivo: `Esperava 3 campos de senha, encontrei ${campos.length}. Site pode ter mudado o layout.`, intervencao: true };
    }

    await campos[0].fill(senhaAntiga);  // senha atual
    await campos[1].fill(senhaNova);    // nova senha
    await campos[2].fill(senhaNova);    // confirmar nova senha

    // Clica no botão de alterar
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, input[type="submit"]'));
      const btn = btns.find(b => {
        const txt = (b.textContent || b.value || '').toLowerCase();
        return txt.includes('alterar') || txt.includes('change') || txt.includes('salvar') || txt.includes('save') || txt.includes('update');
      });
      if (btn) btn.click();
    });

    log('ROBO', 'Unlock Tool → botão de alterar clicado, aguardando confirmação (8s)...');
    await page.waitForTimeout(8000);

    // Verifica confirmação — procura mensagem de sucesso na página
    const conteudo = await page.content();
    const sucesso = conteudo.toLowerCase().includes('success') ||
                    conteudo.toLowerCase().includes('alterada') ||
                    conteudo.toLowerCase().includes('changed') ||
                    conteudo.toLowerCase().includes('updated');

    if (!sucesso) {
      log('AVISO', 'Unlock Tool → não encontrei confirmação de sucesso na página. Verificando URL...');
      // Tenta verificar se ainda está na página de troca (pode ter dado erro silencioso)
      const urlFinal = page.url();
      if (urlFinal.includes('password-change')) {
        return { ok: false, motivo: 'Não houve confirmação de alteração de senha. Possível erro no formulário.', intervencao: false };
      }
    }

    log('OK', `Unlock Tool → senha alterada com sucesso para ${username}`);
    return { ok: true };

  } catch (err) {
    log('ERRO', `Unlock Tool → erro inesperado: ${err.message}`);
    // page.goto timeout = problema temporário de rede/Cloudflare → deve RETRY, não intervention
    const isNavigationTimeout = err.message.includes('page.goto') || err.message.includes('net::');
    const isIntervencao = !isNavigationTimeout && (err.message.includes('Target closed'));
    return { ok: false, motivo: err.message, intervencao: isIntervencao };
  } finally {
    await browser.close();
  }
}

module.exports = { resetarSenha };
