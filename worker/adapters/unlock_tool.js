const net  = require('net');
const http = require('http');
const { firefox } = require('playwright');
const { log } = require('../lib/logger');

// Firefox nativo (sem stealth Chromium-especifico que quebra com Firefox)

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
          `Proxy-Connection: keep-alive\r\n` +
          `\r\n`
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
        const firstLine = header.split('\r\n')[0];
        const statusMatch = header.match(/HTTP\/1\.\d (\d+)/);
        const status = statusMatch ? parseInt(statusMatch[1]) : 0;

        log('ROBO', `Proxy local -> WebShare: ${firstLine} | status=${status}`);

        if (status === 200) {
          log('ROBO', 'Proxy local -> tunel OK!');
          clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
          const rest = headerBuf.slice(end + 4);
          if (rest.length > 0) clientSocket.write(rest);
          upstream.pipe(clientSocket);
          clientSocket.pipe(upstream);
        } else {
          log('ERRO', `Proxy local -> WebShare negou: ${firstLine}`);
          clientSocket.write('HTTP/1.1 502 Bad Gateway\r\n\r\n');
          clientSocket.end();
          upstream.end();
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
  log('ROBO', `Unlock Tool -> iniciando para usuario: ${username}`);

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
    } catch (e) {
      log('AVISO', `Unlock Tool -> proxy local falhou: ${e.message}`);
    }
  } else {
    log('AVISO', 'Unlock Tool -> sem proxy');
  }

  const browser = await firefox.launch(launchOptions);
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0'
  });

  const page = await context.newPage();
  // Bloquear apenas midias pesadas (manter CSS/scripts para Cloudflare challenge)
  await page.route('**/*', (route) => {
    const type = route.request().resourceType();
    if (['image', 'media'].includes(type)) {
      route.abort();
    } else {
      route.continue();
    }
  });

  try {
    log('ROBO', 'Unlock Tool -> [Firefox] navegando para login...');
    await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Log diagnostico: URL e titulo apos navegacao
    const urlPos = page.url();
    const titulo = await page.title().catch(() => 'N/A');
    log('ROBO', `Unlock Tool -> URL atual: ${urlPos} | titulo: ${titulo}`);

    // Aguarda Cloudflare (15s para ter tempo de processar o challenge)
    log('ROBO', 'Unlock Tool -> aguardando Cloudflare processar (15s)...');
    await page.waitForTimeout(15000);

    const urlPos2 = page.url();
    const titulo2 = await page.title().catch(() => 'N/A');
    log('ROBO', `Unlock Tool -> URL apos espera: ${urlPos2} | titulo: ${titulo2}`);

    const seletorUsuario = await aguardarFormLogin(page);
    if (!seletorUsuario) {
      let html = '(nao obtido)';
      try { html = (await page.content()).substring(0, 600); } catch (e) { html = `Erro: ${e.message}`; }
      log('AVISO', `Unlock Tool -> form nao encontrado. HTML: ${html}`);
      return { ok: false, motivo: 'Formulario nao apareceu - Cloudflare bloqueou ou layout mudou', intervencao: true };
    }

    log('ROBO', `Unlock Tool -> formulario OK (${seletorUsuario}), preenchendo...`);
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

    log('ROBO', 'Unlock Tool -> login enviado (12s)...');
    await page.waitForTimeout(12000);

    const urlAtual = page.url();
    if (urlAtual.includes('post-in') || urlAtual.includes('login')) {
      return { ok: false, motivo: 'Login falhou - senha antiga incorreta ou CAPTCHA', intervencao: true };
    }

    log('ROBO', 'Unlock Tool -> login OK! Trocando senha...');
    await page.goto(CHANGE_URL, { waitUntil: 'load', timeout: TIMEOUT_MS });
    await page.waitForTimeout(3000);

    const campos = await page.$$('input[type="password"]');
    if (campos.length < 3) {
      return { ok: false, motivo: `Esperava 3 campos, encontrei ${campos.length}`, intervencao: true };
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

    log('ROBO', 'Unlock Tool -> aguardando confirmacao (8s)...');
    await page.waitForTimeout(8000);

    const conteudo = await page.content();
    const sucesso = conteudo.toLowerCase().includes('success') ||
                    conteudo.toLowerCase().includes('alterada') ||
                    conteudo.toLowerCase().includes('changed') ||
                    conteudo.toLowerCase().includes('updated');

    if (!sucesso) {
      const urlFinal = page.url();
      if (urlFinal.includes('password-change')) {
        return { ok: false, motivo: 'Sem confirmacao de alteracao', intervencao: false };
      }
    }

    log('OK', `Unlock Tool -> senha alterada com sucesso para ${username}`);
    return { ok: true };

  } catch (err) {
    log('ERRO', `Unlock Tool -> erro: ${err.message}`);
    const isTimeout = err.message.includes('page.goto') || err.message.includes('net::') || err.message.includes('NS_') || err.message.includes('SSL_') || err.message.includes('Target page');
    return { ok: false, motivo: err.message, intervencao: !isTimeout };
  } finally {
    await browser.close().catch(() => {});
    if (localProxy) localProxy.server.close();
  }
}

module.exports = { resetarSenha };
