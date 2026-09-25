const net  = require('net');
const http = require('http');
const { firefox } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
const { log } = require('../lib/logger');

firefox.use(stealth);

const LOGIN_URL  = 'https://unlocktool.net/post-in/';
const CHANGE_URL = 'https://unlocktool.net/password-change/';
const TIMEOUT_MS = 90000;

// Proxy local HTTP: Playwright se conecta sem auth, proxy repassa com auth pro WebShare
// Necessario porque Firefox nao suporta SOCKS5 autenticado via playwright-extra
function startLocalProxy(upstreamHost, upstreamPort, username, password) {
  return new Promise((resolve, reject) => {
    const server = http.createServer();

    server.on('connect', (req, clientSocket) => {
      const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');

      const upstream = net.connect(upstreamPort, upstreamHost, () => {
        upstream.write(
          `CONNECT ${req.url} HTTP/1.1\r\n` +
          `Host: ${req.url}\r\n` +
          `Proxy-Authorization: ${authHeader}\r\n` +
          `Proxy-Connection: keep-alive\r\n` +
          `\r\n`
        );
      });

      let buffer = Buffer.alloc(0);
      let tunnelOk = false;

      upstream.on('data', (chunk) => {
        if (tunnelOk) { clientSocket.write(chunk); return; }
        buffer = Buffer.concat([buffer, chunk]);
        const end = buffer.indexOf('\r\n\r\n');
        if (end >= 0) {
          const header = buffer.slice(0, end).toString();
          const firstLine = header.split('\r\n')[0];
          const statusMatch = header.match(/HTTP\/1\.\d (\d+)/);
          const status = statusMatch ? parseInt(statusMatch[1]) : 0;

          log('ROBO', `Proxy local → WebShare resp: ${firstLine} | status=${status}`);

          if (status === 200) {
            tunnelOk = true;
            log('ROBO', 'Proxy local → tunel OK! Repassando para Firefox...');
            clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
            const rest = buffer.slice(end + 4);
            if (rest.length > 0) clientSocket.write(rest);
            // FIX: remover handler antigo para evitar dados duplicados no TLS
            upstream.removeAllListeners('data');
            upstream.on('data', (d) => clientSocket.write(d));
            clientSocket.pipe(upstream);
          } else {
            log('ERRO', `Proxy local → WebShare negou: ${firstLine}`);
            clientSocket.write(`HTTP/1.1 502 Bad Gateway\r\n\r\n`);
            clientSocket.end();
            upstream.end();
          }
        }
      });

      clientSocket.on('data', (d) => { if (tunnelOk) upstream.write(d); });
      upstream.on('error',     () => { clientSocket.write('HTTP/1.1 502 Bad Gateway\r\n\r\n'); clientSocket.destroy(); });
      clientSocket.on('error', () => upstream.destroy());
      upstream.on('end',       () => clientSocket.end());
      clientSocket.on('end',   () => upstream.end());
    });

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      log('ROBO', `Unlock Tool → proxy local 127.0.0.1:${port} -> ${upstreamHost}:${upstreamPort}`);
      resolve({ server, port });
    });
    server.on('error', reject);
  });
}

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
    } catch (_) {}
  }
  return null;
}

async function resetarSenha({ username, senhaAntiga, senhaNova }) {
  log('ROBO', `Unlock Tool → iniciando para usuario: ${username}`);

  const proxyHost = process.env.PROXY_HOST || 'p.webshare.io';
  const proxyPort = parseInt(process.env.PROXY_PORT || '80', 10);
  const proxyUser = process.env.PROXY_USER;
  const proxyPass = process.env.PROXY_PASS;

  let localProxy = null;

  // Firefox: headless=true mas TLS fingerprint diferente do Chromium
  const launchOptions = {
    headless: true,
  };

  if (proxyUser && proxyPass) {
    try {
      localProxy = await startLocalProxy(proxyHost, proxyPort, proxyUser, proxyPass);
      launchOptions.proxy = { server: `http://127.0.0.1:${localProxy.port}` };
      log('ROBO', `Unlock Tool → Firefox usa proxy local (sem auth) | user: ${proxyUser}`);
    } catch (e) {
      log('AVISO', `Unlock Tool → proxy local falhou: ${e.message}`);
    }
  } else {
    log('AVISO', 'Unlock Tool → sem proxy configurado');
  }

  const browser = await firefox.launch(launchOptions);
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0'
  });

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
    log('ROBO', 'Unlock Tool → [Firefox] acessando pagina de login (aguardando Cloudflare)...');
    await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(8000);

    const seletorUsuario = await aguardarFormLogin(page);
    if (!seletorUsuario) {
      const html = (await page.content()).substring(0, 500);
      log('AVISO', `Unlock Tool → HTML da pagina: ${html}`);
      return { ok: false, motivo: 'Formulario de login nao apareceu - Cloudflare bloqueou', intervencao: true };
    }

    log('ROBO', `Unlock Tool → formulario encontrado (${seletorUsuario}), preenchendo...`);
    await page.fill(seletorUsuario, username);

    const camposSenha = await page.$$('input[type="password"]');
    if (camposSenha.length === 0) {
      return { ok: false, motivo: 'Campo de senha nao encontrado', intervencao: true };
    }
    await camposSenha[0].fill(senhaAntiga);

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, input[type="submit"]'));
      const btn = btns.find(b => {
        const txt = (b.textContent || b.value || '').toLowerCase();
        return txt.includes('login') || txt.includes('entrar') || txt.includes('sign') || txt.includes('conect');
      });
      if (btn) btn.click();
    });

    log('ROBO', 'Unlock Tool → login enviado, aguardando (12s)...');
    await page.waitForTimeout(12000);

    const urlAtual = page.url();
    if (urlAtual.includes('post-in') || urlAtual.includes('login')) {
      return { ok: false, motivo: 'Login falhou - senha antiga incorreta ou CAPTCHA', intervencao: true };
    }

    log('ROBO', 'Unlock Tool → login OK! Acessando troca de senha...');
    await page.goto(CHANGE_URL, { waitUntil: 'load', timeout: TIMEOUT_MS });
    await page.waitForTimeout(3000);

    const campos = await page.$$('input[type="password"]');
    if (campos.length < 3) {
      return { ok: false, motivo: `Esperava 3 campos de senha, encontrei ${campos.length}`, intervencao: true };
    }

    await campos[0].fill(senhaAntiga);
    await campos[1].fill(senhaNova);
    await campos[2].fill(senhaNova);

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, input[type="submit"]'));
      const btn = btns.find(b => {
        const txt = (b.textContent || b.value || '').toLowerCase();
        return txt.includes('alterar') || txt.includes('change') || txt.includes('salvar') || txt.includes('save') || txt.includes('update');
      });
      if (btn) btn.click();
    });

    log('ROBO', 'Unlock Tool → botao clicado, aguardando confirmacao (8s)...');
    await page.waitForTimeout(8000);

    const conteudo = await page.content();
    const sucesso = conteudo.toLowerCase().includes('success') ||
                    conteudo.toLowerCase().includes('alterada') ||
                    conteudo.toLowerCase().includes('changed') ||
                    conteudo.toLowerCase().includes('updated');

    if (!sucesso) {
      const urlFinal = page.url();
      if (urlFinal.includes('password-change')) {
        return { ok: false, motivo: 'Sem confirmacao de alteracao de senha', intervencao: false };
      }
    }

    log('OK', `Unlock Tool → senha alterada com sucesso para ${username}`);
    return { ok: true };

  } catch (err) {
    log('ERRO', `Unlock Tool → erro inesperado: ${err.message}`);
    const isNavigationTimeout = err.message.includes('page.goto') || err.message.includes('net::');
    const isIntervencao = !isNavigationTimeout && err.message.includes('Target closed');
    return { ok: false, motivo: err.message, intervencao: isIntervencao };
  } finally {
    await browser.close();
    if (localProxy) localProxy.server.close();
  }
}

module.exports = { resetarSenha };

