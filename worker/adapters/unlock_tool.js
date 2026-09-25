const net  = require('net');
const http = require('http');
const { firefox } = require('playwright');
const { log } = require('../lib/logger');

const LOGIN_URL  = 'https://unlocktool.net/post-in/';
const CHANGE_URL = 'https://unlocktool.net/password-change/';
const TIMEOUT_MS = 90000;

function startLocalProxy(upstreamHost, upstreamPort, username, password) {
  return new Promise((resolve, reject) => {
    const server = http.createServer();
    server.on('connect', (req, clientSocket) => {
      const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
      const upstream = net.connect(upstreamPort, upstreamHost);
      upstream.setNoDelay(true);
      clientSocket.setNoDelay(true);
      upstream.on('connect', () => {
        upstream.write(
          `CONNECT ${req.url} HTTP/1.1\r\n` +
          `Host: ${req.url}\r\n` +
          `Proxy-Authorization: ${authHeader}\r\n` +
          `Proxy-Connection: keep-alive\r\n\r\n`
        );
      });
      let headerBuf = Buffer.alloc(0);
      let headerDone = false;
      function onData(chunk) {
        headerBuf = Buffer.concat([headerBuf, chunk]);
        const end = headerBuf.indexOf('\r\n\r\n');
        if (end < 0) return;
        upstream.removeListener('data', onData);
        headerDone = true;
        const header = headerBuf.slice(0, end).toString();
        const m = header.match(/HTTP\/1\.\d (\d+)/);
        const status = m ? parseInt(m[1]) : 0;
        log('ROBO', `Proxy -> WebShare: ${header.split('\r\n')[0]} | ${status}`);
        if (status === 200) {
          log('ROBO', 'Proxy -> tunel OK!');
          clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
          const rest = headerBuf.slice(end + 4);
          if (rest.length > 0) clientSocket.write(rest);
          upstream.pipe(clientSocket);
          clientSocket.pipe(upstream);
        } else {
          clientSocket.write('HTTP/1.1 502 Bad Gateway\r\n\r\n');
          clientSocket.end(); upstream.end();
        }
      }
      upstream.on('data', onData);
      upstream.on('error', () => { if (!headerDone) clientSocket.write('HTTP/1.1 502 Bad Gateway\r\n\r\n'); clientSocket.destroy(); });
      clientSocket.on('error', () => upstream.destroy());
      upstream.on('close', () => clientSocket.destroy());
      clientSocket.on('close', () => upstream.destroy());
    });
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      log('ROBO', `Proxy local 127.0.0.1:${port} -> ${upstreamHost}:${upstreamPort}`);
      resolve({ server, port });
    });
    server.on('error', reject);
  });
}

async function aguardarFormLogin(page) {
  const seletores = ['input[name="username"]','input[type="text"]','input[id*="user"]','input[placeholder*="user" i]','input[placeholder*="login" i]'];
  for (const sel of seletores) {
    try { await page.waitForSelector(sel, { timeout: 10000 }); return sel; } catch (_) {}
  }
  return null;
}

async function resetarSenha({ username, senhaAntiga, senhaNova }) {
  log('ROBO', `Unlock Tool -> usuario: ${username}`);
  const proxyHost = process.env.PROXY_HOST || 'p.webshare.io';
  const proxyPort = parseInt(process.env.PROXY_PORT || '80', 10);
  const proxyUser = process.env.PROXY_USER;
  const proxyPass = process.env.PROXY_PASS;
  let localProxy = null;
  const launchOptions = { headless: true };
  if (proxyUser && proxyPass) {
    try {
      localProxy = await startLocalProxy(proxyHost, proxyPort, proxyUser, proxyPass);
      launchOptions.proxy = { server: `http://127.0.0.1:${localProxy.port}` };
      log('ROBO', `Unlock Tool -> Firefox porta ${localProxy.port} | user: ${proxyUser}`);
    } catch (e) { log('AVISO', `proxy falhou: ${e.message}`); }
  }

  const browser = await firefox.launch({
    headless: false,  // Xvfb fornece display virtual - Firefox nao-headless bypassa Cloudflare melhor
    firefoxUserPrefs: {
      'webgl.disabled': false,
      'webgl.force-enabled': true,
      'media.hardware-video-decoding.force-enabled': false,
      'layers.acceleration.disabled': false,
    }
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
    viewport: { width: 1920, height: 1080 },
  });

  // Patch: ocultar navigator.webdriver (Cloudflare usa isso para detectar bots)
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    Object.defineProperty(navigator, 'plugins', { get: () => [1,2,3,4,5] });
    Object.defineProperty(navigator, 'languages', { get: () => ['pt-BR','pt','en-US','en'] });
  });

  const page = await context.newPage();
  // Nao bloquear recursos - Cloudflare precisa carregar seus scripts

  try {
    log('ROBO', 'Unlock Tool -> [Firefox] navegando...');
    await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

    const urlInicial = page.url();
    const tituloInicial = await page.title().catch(() => 'N/A');
    log('ROBO', `URL inicial: ${urlInicial.substring(0, 80)} | titulo: ${tituloInicial}`);

    // Aguardar Cloudflare: esperar ate titulo mudar de "Just a moment..." (max 60s)
    log('ROBO', 'Aguardando Cloudflare challenge completar (max 60s)...');
    try {
      await page.waitForFunction(
        () => document.title !== 'Just a moment...' && document.title !== '',
        { timeout: 60000, polling: 1000 }
      );
    } catch (_) {
      log('AVISO', 'Cloudflare challenge nao completou em 60s');
    }

    const urlFinal = page.url();
    const tituloFinal = await page.title().catch(() => 'N/A');
    log('ROBO', `URL apos challenge: ${urlFinal.substring(0, 80)} | titulo: ${tituloFinal}`);

    const seletorUsuario = await aguardarFormLogin(page);
    if (!seletorUsuario) {
      let html = '(nao obtido)';
      try { html = (await page.content()).substring(0, 600); } catch (e) { html = e.message; }
      log('AVISO', `form nao encontrado. HTML: ${html}`);
      return { ok: false, motivo: 'Formulario nao apareceu - Cloudflare bloqueou', intervencao: true };
    }

    log('ROBO', `Formulario OK (${seletorUsuario}), preenchendo...`);
    await page.fill(seletorUsuario, username);
    const camposSenha = await page.$$('input[type="password"]');
    if (!camposSenha.length) return { ok: false, motivo: 'Campo senha nao encontrado', intervencao: true };
    await camposSenha[0].fill(senhaAntiga);

    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button,input[type="submit"]')).find(b => {
        const t = (b.textContent || b.value || '').toLowerCase();
        return t.includes('login') || t.includes('entrar') || t.includes('sign') || t.includes('conect');
      });
      if (btn) btn.click();
    });

    log('ROBO', 'Login enviado (12s)...');
    await page.waitForTimeout(12000);
    const urlLogin = page.url();
    if (urlLogin.includes('post-in') || urlLogin.includes('login')) {
      return { ok: false, motivo: 'Login falhou - senha antiga incorreta ou CAPTCHA', intervencao: true };
    }

    log('ROBO', 'Login OK! Trocando senha...');
    await page.goto(CHANGE_URL, { waitUntil: 'load', timeout: TIMEOUT_MS });
    await page.waitForTimeout(3000);

    const campos = await page.$$('input[type="password"]');
    if (campos.length < 3) return { ok: false, motivo: `Esperava 3 campos, encontrei ${campos.length}`, intervencao: true };
    await campos[0].fill(senhaAntiga);
    await campos[1].fill(senhaNova);
    await campos[2].fill(senhaNova);

    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button,input[type="submit"]')).find(b => {
        const t = (b.textContent || b.value || '').toLowerCase();
        return t.includes('alterar') || t.includes('change') || t.includes('salvar') || t.includes('save') || t.includes('update');
      });
      if (btn) btn.click();
    });

    log('ROBO', 'Aguardando confirmacao (8s)...');
    await page.waitForTimeout(8000);
    const conteudo = await page.content();
    const sucesso = ['success','alterada','changed','updated'].some(w => conteudo.toLowerCase().includes(w));

    if (!sucesso) {
      const urlChg = page.url();
      if (urlChg.includes('password-change')) return { ok: false, motivo: 'Sem confirmacao', intervencao: false };
    }

    log('OK', `Senha alterada para ${username}`);
    return { ok: true };
  } catch (err) {
    log('ERRO', `Erro: ${err.message}`);
    const isTimeout = ['page.goto','net::','NS_','SSL_','Target page','Target closed'].some(s => err.message.includes(s));
    return { ok: false, motivo: err.message, intervencao: !isTimeout };
  } finally {
    await browser.close().catch(() => {});
    if (localProxy) localProxy.server.close();
  }
}

module.exports = { resetarSenha };
