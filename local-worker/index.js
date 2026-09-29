/**
 * =========================================================
 *  CENTRAL GSM — WORKER LOCAL (PC) — 100% AUTOMATICO
 *  Suporta: UnlockTool, TSM, Android Multi, TFM, Cell Tool, DFT Pro
 *  Chrome abre sozinho via CDP — Cloudflare bypassa!
 * =========================================================
 */

const path   = require('path');
const http   = require('http');
const fs     = require('fs');
const { spawn } = require('child_process');
const { createClient } = require('@supabase/supabase-js');
const { chromium } = require('playwright');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// ── Config ────────────────────────────────────────────────
const INTERVALO_MS   = 30 * 60 * 1000; // 30 minutos
const MAX_TENTATIVAS = 4;
const CDP_URL        = 'http://localhost:9222';
const CHROME_PROFILE = path.join(__dirname, 'chrome-real-profile');

const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  (process.env.LOCALAPPDATA || '') + '\\Google\\Chrome\\Application\\chrome.exe',
];

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERRO: Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function log(nivel, msg) {
  const hora = new Date().toLocaleTimeString('pt-BR');
  console.log(`[${hora}] [${nivel}] ${msg}`);
}

// ── Configuracoes de cada ferramenta ─────────────────────

const FERRAMENTAS = {
  unlock: {
    nome: 'UnlockTool',
    keywords: ['unlock'],
    loginUrl: 'https://unlocktool.net/post-in/',
    passwordChangeUrl: 'https://unlocktool.net/password-change/',
    userSel: 'input[name="username"], input[type="text"]',
    passSel: 'input[type="password"]',
    submitSel: 'button[type="submit"], input[type="submit"]',
    temCloudflare: true,
  },
  tsm: {
    nome: 'TSM Tool',
    keywords: ['tsm'],
    loginUrl: 'https://tsm-tool.com/login',
    logoutUrl: 'https://tsm-tool.com/?act=Logout',
    passwordChangeUrl: 'https://tsm-tool.com/?act=UserUpdate',
    userSel: 'input[placeholder*="Username" i], input[placeholder*="Email" i], input[name="email"], input[name="username"]',
    passSel: 'input[type="password"]',
    submitSel: 'input.btn-primary, button[type="submit"], input[type="submit"]',
    temCloudflare: false,
  },
  androidmulti: {
    nome: 'Android Multi Tool',
    keywords: ['android multi', 'android_multi'],
    loginUrl: 'https://androidmultitool.com/controller/login',
    passwordChangeUrl: 'https://androidmultitool.com/controller/account/',
    logoutUrl: 'https://androidmultitool.com/controller/login?action=logout',
    userSel: 'input#email, input[name="email"], input[placeholder*="Email" i]',
    passSel: 'input#password, input[type="password"]',
    submitSel: 'button.btn-primary, button[type="submit"]',
    temCloudflare: true,
  },
  tfm: {
    nome: 'TFM Tool',
    keywords: ['tfm'],
    loginUrl: 'https://beta.tfmtool.com/auth/login',
    logoutUrl: 'https://beta.tfmtool.com/auth/logout',
    passwordChangeUrl: 'https://beta.tfmtool.com/dashboard/profile',
    userSel: 'input#email, input[name="email"], input[name="username"], input[type="email"], input[placeholder*="email" i], input[placeholder*="user" i], input[type="text"]',
    passSel: 'input#password, input[type="password"], input[name="password"]',
    submitSel: 'button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Sign in"), button.btn',
    temCloudflare: false,
  },
  dft: {
    nome: 'DFT Pro',
    keywords: ['dft'],
    loginUrl: 'https://www.dftpro.com/user/login.php',
    passwordChangeUrl: null,
    userSel: 'input[placeholder="Username" i], input[name="username"]',
    passSel: 'input[type="password"]',
    submitSel: 'button.btn-login-custom, button[type="submit"], input[type="submit"]',
    temCloudflare: true,
  },
};

// ── Detectar ferramenta pelo service_title ────────────────

function detectarFerramenta(serviceTitle) {
  const t = (serviceTitle || '').toLowerCase();
  for (const [key, cfg] of Object.entries(FERRAMENTAS)) {
    if (cfg.keywords.some(k => t.includes(k))) return key;
  }
  return null;
}

// ── Supabase helpers ──────────────────────────────────────

async function buscarTarefa() {
  const agora = new Date().toISOString();
  const { data, error } = await supabase
    .from('automation_tasks')
    .select('*')
    .eq('type', 'password_reset')
    .or('status.eq.pending,status.eq.running')
    .or(`next_retry_at.is.null,next_retry_at.lte.${agora}`)
    .not('account_id', 'is', null)   // ignora tarefas sem conta vinculada
    .order('created_at', { ascending: true })
    .limit(20);

  if (error) { log('ERRO', `Supabase: ${error.message}`); return null; }
  if (!data || data.length === 0) return null;

  // Pega primeira tarefa com ferramenta reconhecida
  return data.find(t => detectarFerramenta(t.service_title) !== null) || null;
}

async function marcarRodando(id) {
  await supabase.from('automation_tasks')
    .update({ status: 'running', updated_at: new Date().toISOString() })
    .eq('id', id);
}

async function marcarSucesso(id) {
  await supabase.from('automation_tasks')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', id);
}

async function marcarFalha(task, motivo, intervencao) {
  const tentativas = (task.attempts || 0) + 1;
  const status = intervencao ? 'needs_intervention'
    : tentativas >= MAX_TENTATIVAS ? 'failed' : 'pending';
  const retry = status === 'pending'
    ? new Date(Date.now() + 5 * 60 * 1000).toISOString()
    : null;
  await supabase.from('automation_tasks')
    .update({ status, attempts: tentativas, error_message: motivo, next_retry_at: retry, updated_at: new Date().toISOString() })
    .eq('id', task.id);
}

async function atualizarConta(accountId, novaSenha, email) {
  const { error } = await supabase.from('service_accounts')
    .update({
      status: 'available',
      credentials: { email, password: novaSenha }
    })
    .eq('id', accountId);
  if (error) log('ERRO', `Falha ao atualizar conta: ${error.message}`);
  else log('INFO', `✅ Conta ${email} atualizada! Nova senha: ${novaSenha}`);
}

// ── Chrome: auto-abrir se necessario ─────────────────────

function verificarChromeAberto() {
  return new Promise((resolve) => {
    http.get(`${CDP_URL}/json/version`, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => resolve(false));
  });
}

async function abrirChromeSeNecessario() {
  const jaAberto = await verificarChromeAberto();
  if (jaAberto) { log('INFO', 'Chrome ja aberto!'); return true; }

  const chromePath = CHROME_PATHS.find(p => fs.existsSync(p));
  if (!chromePath) { log('ERRO', 'Google Chrome nao encontrado!'); return false; }

  log('INFO', 'Abrindo Chrome automaticamente...');
  spawn(chromePath, [
    '--remote-debugging-port=9222',
    `--user-data-dir=${CHROME_PROFILE}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1280,900',
    '--start-minimized',
  ], { detached: true, stdio: 'ignore' }).unref();

  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 2000));
    if (await verificarChromeAberto()) {
      log('INFO', `Chrome pronto em ${(i + 1) * 2}s!`);
      await new Promise(r => setTimeout(r, 5000));
      return true;
    }
  }
  log('ERRO', 'Chrome demorou demais!');
  return false;
}

// ── Helpers ───────────────────────────────────────────────

function gerarSenha() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#';
  let s = '';
  for (let i = 0; i < 12; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

// Tenta encontrar URL de troca de senha navegando no site logado
async function encontrarUrlTrocaSenha(page, baseUrl) {
  const keywords = ['password', 'senha', 'profile', 'perfil', 'account', 'conta', 'settings', 'setting', 'configurac', 'usuario', 'user'];
  const links = await page.$$eval('a', els =>
    els.map(a => ({ href: a.href, text: (a.innerText || '').toLowerCase() }))
  );
  for (const link of links) {
    if (keywords.some(k => link.href.toLowerCase().includes(k) || link.text.includes(k))) {
      if (link.href && link.href.startsWith('http')) return link.href;
    }
  }
  // Tentar URLs comuns
  const comuns = ['/user/setting', '/user/settings', '/password-change', '/change-password', '/profile', '/account', '/settings', '/user/profile', '/user/password'];
  for (const u of comuns) {
    const url = baseUrl.replace(/\/$/, '') + u;
    try {
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
      if (resp && resp.ok()) return url;
    } catch {}
  }
  return null;
}

// Preenche e submete formulario de troca de senha
async function trocarSenhaNaPagina(page, senhaAntiga, senhaNova) {
  await page.waitForTimeout(3000);

  // Tenta abrir modais de troca de senha (ex: TFM Beta)
  await page.evaluate(() => {
    const els = [...document.querySelectorAll('*')];
    const btnModal = els.find(b => {
      // Ignora elementos que tem filhos textuais soltos, foca nos mais internos
      if (b.children.length > 0 && b.tagName !== 'BUTTON' && b.tagName !== 'A') return false; 
      const txt = (b.textContent || '').trim().toLowerCase();
      return txt === 'alterar a senha' || txt === 'change password' || txt === 'alterar senha';
    });
    if (btnModal) btnModal.click();
  });
  await page.waitForTimeout(1500);

  // Metodo 1: input[type="password"]
  let campos = [];
  for (let i = 0; i < 10; i++) {
    campos = await page.$$('input[type="password"]');
    if (campos.length >= 3) break;
    await page.waitForTimeout(500);
  }

  // Metodo 2: placeholder com senha/password
  if (campos.length < 3) {
    const altCampos = await page.$$('input[placeholder*="password" i], input[placeholder*="senha" i]');
    if (altCampos.length >= 3) campos = altCampos;
  }

  // Metodo 3: name ou id com senha/password
  if (!campos.length) {
    const todosInputs = await page.$$('input:not([type="hidden"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]):not([disabled])');
    for (const inp of todosInputs) {
      const attrs = await inp.evaluate(el => ({
        placeholder: (el.placeholder || '').toLowerCase(),
        name: (el.name || '').toLowerCase(),
        id: (el.id || '').toLowerCase(),
        type: el.type || 'text'
      })).catch(() => ({}));
      if (['password','senha','pass','pwd'].some(k =>
        attrs.placeholder?.includes(k) || attrs.name?.includes(k) || attrs.id?.includes(k))) {
        campos = [inp];
        log('ROBO', `Campo senha encontrado por atributo: name=${attrs.name} id=${attrs.id}`);
        break;
      }
    }
  }

  if (!campos.length) {
    log('ROBO', 'Nenhum campo de senha encontrado na pagina!');
    return false;
  }

  if (campos.length === 1) {
    // TSM Tool / AMT: apenas 1 campo - so a nova senha
    await campos[0].fill(senhaNova);
    log('ROBO', 'Preenchendo campo unico de senha');
  } else if (campos.length >= 3) {
    await campos[0].fill(senhaAntiga); // Senha atual
    await campos[1].fill(senhaNova);   // Nova senha
    await campos[2].fill(senhaNova);   // Confirmar
  } else {
    await campos[0].fill(senhaNova);   // Nova senha
    await campos[1].fill(senhaNova);   // Confirmar
  }

  const urlAntes = page.url();
  await page.waitForTimeout(500);

  // Clicar botao - estrategias em ordem de prioridade
  let clicou = false;

  // PRIORIDADE 0: Playwright getByText - clique fisico real (funciona em Vue/Nuxt modals)
  if (!clicou) {
    for (const texto of ['Atualizar senha', 'Update password', 'Atualizar Senha', 'Update Password']) {
      try {
        const btn = page.getByText(texto, { exact: true });
        if (await btn.count() > 0) {
          await btn.first().click({ force: true });
          clicou = true;
          log('ROBO', `Botao clicado por getByText exato: "${texto}"`);
          break;
        }
      } catch {}
    }
  }
  // 0: page.evaluate - clica no botao DEPOIS dos campos de senha (evita clicar no botao errado)
  if (!clicou) {
    try {
      const clicked = await page.evaluate(() => {
        // Achar o ULTIMO campo de senha na pagina
        const passFields = [...document.querySelectorAll('input[type="password"], input[placeholder*="password" i], input[placeholder*="senha" i]')];
        const lastPassField = passFields[passFields.length - 1] || null;

        const allBtns = [...document.querySelectorAll('button, input[type="submit"], a.btn, [role="button"]')];

        let btn = null;
        if (lastPassField) {
          // Pegar o primeiro botao de submit/save que aparece APOS o ultimo campo de senha no DOM
          btn = allBtns.find(b => {
            const isAfter = lastPassField.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING;
            const txt = (b.textContent || b.value || '').toLowerCase().trim();
            const isSaveBtn = b.type === 'submit' || txt.includes('update') || txt.includes('salvar') || txt.includes('save') || txt.includes('confirm') || txt.includes('change') || txt.includes('atualizar');
            return isAfter && isSaveBtn;
          });
        }
        // Fallback: botao com texto de salvar/update
        if (!btn) {
          btn = allBtns.find(el => {
            const txt = (el.textContent || el.value || '').toLowerCase().trim();
            return txt.includes('update') || txt.includes('salvar') || txt.includes('save') || txt.includes('atualizar') || txt.includes('confirmar') || txt === 'atualizar senha' || txt === 'update password';
          });
        }
        if (btn) {
          btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
          btn.click();
          return (btn.textContent || btn.value || 'btn').trim().substring(0, 40);
        }
        return null;
      });
      if (clicked) { clicou = true; log('ROBO', `Botao clicado via JS: "${clicked}"`); }
    } catch {}
  }

  // 1: Locator com texto (button, a, role=button)
  if (!clicou) {
    try {
      const btnLocator = page.locator('button, input[type="submit"], a, [role="button"]').filter({
        hasText: /salvar|save|update|atualizar|confirmar|update profile|atualizar perfil|atualizar senha|update password/i
      });
      if (await btnLocator.count() > 0) {
        await btnLocator.first().click();
        clicou = true;
        log('ROBO', 'Botao clicado por texto/locator!');
      }
    } catch {}
  }

  // 2: getByRole button
  if (!clicou) {
    try {
      const btn = page.getByRole('button', { name: /update|salvar|save|atualizar|atualizar senha|update password/i });
      if (await btn.count() > 0) { await btn.first().click(); clicou = true; log('ROBO', 'Botao clicado por getByRole!'); }
    } catch {}
  }

  // 3: text selector direto do Playwright
  if (!clicou) {
    for (const txt of ['Atualizar senha', 'Update password', 'Update Profile', 'Atualizar perfil', 'Salvar alterações', 'Save', 'Update']) {
      const el = await page.$(`text=${txt}`).catch(() => null);
      if (el) { await el.click(); clicou = true; log('ROBO', `Botao clicado por text="${txt}"!`); break; }
    }
  }

  // 4: CSS seletores
  if (!clicou) {
    const btn = await page.$('button[type="submit"], input[type="submit"], .btn-primary, .btn-success, button.btn');
    if (btn) { await btn.click(); clicou = true; log('ROBO', 'Botao clicado por CSS'); }
  }

  if (!clicou) {
    await page.keyboard.press('Enter');
    log('ROBO', 'Pressionando Enter como fallback');
  }

  // Aguarda resposta (ate 6 segundos)
  await page.waitForTimeout(6000);

  const urlDepois = page.url();

  // Checar apenas TEXTO VISIVEL (nao HTML completo que tem 'error' em JS/CSS)
  const textoVisivel = await page.evaluate(() => (document.body?.innerText || '').toLowerCase()).catch(() => '');

  // Verifica ERROS visiveis para o usuario
  const temErro = ['senha incorreta', 'senha atual incorreta', 'current password incorrect',
    'invalid password', 'wrong password', 'incorrect password', 'password mismatch',
    'senhas nao coincidem', 'passwords do not match'].some(e => textoVisivel.includes(e));
  if (temErro) {
    log('ROBO', 'Formulario retornou ERRO visivel de senha');
    return false;
  }

  // Verifica SUCESSO por palavras-chave no texto visivel
  const temSucesso = ['success', 'sucesso', 'alterada', 'changed', 'updated', 'atualizada',
    'salvo', 'saved', 'password updated', 'senha alterada', 'profile updated',
    'perfil atualizado', 'password changed', 'senha atualizada'].some(s => textoVisivel.includes(s));
  if (temSucesso) { log('ROBO', 'Sucesso confirmado por texto!'); return true; }

  // Se nao tem erro E a URL mudou (redirect apos submit), provavelmente deu certo
  const baseAntes = urlAntes.split('#')[0].split('?')[0];
  const baseDepois = urlDepois.split('#')[0].split('?')[0];
  
  if (baseDepois !== baseAntes) {
    log('ROBO', `URL mudou (${baseAntes} → ${baseDepois}) - assumindo sucesso`);
    return true;
  }

  // Se o modal fechou (nao ha mais campos de senha na tela) e nao tem erro = sucesso!
  if (clicou) {
    const camposRestantes = await page.$$('input[type="password"]').catch(() => []);
    if (camposRestantes.length === 0) {
      log('ROBO', 'Modal fechou apos clique (sem campos de senha visiveis) - assumindo sucesso!');
      return true;
    }
  }

  // Sem sucesso confirmado
  if (!clicou) log('ROBO', 'Nenhum botao foi clicado!');
  else log('ROBO', 'Botao clicado mas sem confirmacao de sucesso na pagina');
  return false;
}

// ── Logout helper ─────────────────────────────────────────

async function fazerLogout(page, config) {
  try {
    // 1: logoutUrl direto (mais rapido)
    if (config.logoutUrl) {
      await page.goto(config.logoutUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(1500);
      log('ROBO', `[${config.nome}] Logout via URL!`);
      return true;
    }
    // 2: Clicar no link Logout/Sair na pagina
    const logoutEl = await page.$('a:has-text("Logout"), a:has-text("logout"), a:has-text("Sair"), a:has-text("Sign out")').catch(() => null);
    if (logoutEl) {
      await logoutEl.click();
      await page.waitForTimeout(1500);
      log('ROBO', `[${config.nome}] Logout via click!`);
      return true;
    }
    // 3: page.evaluate - encontrar link logout no DOM
    const clicked = await page.evaluate(() => {
      const links = [...document.querySelectorAll('a')];
      const btn = links.find(l => /logout|sair|sign.?out/i.test(l.textContent || l.href || ''));
      if (btn) { btn.click(); return true; }
      return false;
    });
    if (clicked) { await page.waitForTimeout(1500); log('ROBO', `[${config.nome}] Logout via JS!`); return true; }
    return false;
  } catch {
    return false;
  }
}

// ── Processador GENERICO (TSM, AMT, TFM, DFT) ────────────

async function processarFerramenta(task, config) {
  let { email: username, old_password: senhaAntiga } = task.payload || {};
  if (!username || !senhaAntiga) {
    return { ok: false, motivo: 'Dados incompletos no payload', intervencao: true };
  }
  
  username = username.trim();
  senhaAntiga = senhaAntiga.trim();

  // Cell Tool tem captcha de imagem - nao da pra automatizar
  if (config.temCaptchaImagem) {
    return {
      ok: false,
      motivo: `${config.nome} tem captcha de imagem - troque a senha manualmente e clique RESET MANUAL`,
      intervencao: true
    };
  }

  const senhaNova = task.payload?.new_password || gerarSenha();
  log('ROBO', `[${config.nome}] Processando: ${username}`);
  log('INFO', `[${config.nome}] Senha nova: ${senhaNova}  ← GUARDE SE FALHAR`);

  const chromeOk = await abrirChromeSeNecessario();
  if (!chromeOk) return { ok: false, motivo: 'Chrome nao abriu', intervencao: true };

  let page = null;
  try {
    const browser = await chromium.connectOverCDP(CDP_URL);
    const context = browser.contexts()[0];
    page = await context.newPage();
    page.setDefaultTimeout(60000);

    log('ROBO', `[${config.nome}] Limpando cookies e sessao anterior...`);
    await context.clearCookies();
    // Limpar localStorage e sessionStorage (sites SPA como TFM usam isso para sessao)
    try {
      const origin = new URL(config.loginUrl).origin;
      await page.goto(origin, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.evaluate(() => {
        try { localStorage.clear(); } catch {}
        try { sessionStorage.clear(); } catch {}
      });
      log('ROBO', `[${config.nome}] localStorage e sessionStorage limpos!`);
    } catch {}

    // LOGIN
    log('ROBO', `[${config.nome}] Abrindo ${config.loginUrl}...`);
    await page.goto(config.loginUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    // Verificar se ja esta logado (redirecionou para fora do login)
    const urlDepoisDeIr = page.url();
    let jaLogado = !urlDepoisDeIr.toLowerCase().includes('login') &&
                   !urlDepoisDeIr.toLowerCase().includes('signin') &&
                   !urlDepoisDeIr.toLowerCase().includes('cloudflare') &&
                   !urlDepoisDeIr.toLowerCase().includes('challenge');

    // Se nao redirecionou, procura por um botao de "Logout" na pagina para confirmar
    if (!jaLogado) {
      const temLogout = await page.evaluate(() => {
        const els = [...document.querySelectorAll('a, button, span, div')];
        return els.some(el => {
          const txt = (el.textContent || '').toLowerCase().trim();
          const href = (el.href || '').toLowerCase();
          return txt === 'logout' || txt === 'sign out' || txt === 'sair' || href.includes('logout');
        });
      });
      if (temLogout) jaLogado = true;
    }

    if (jaLogado) {
      log('ROBO', `[${config.nome}] Ja estava logado - fazendo logout...`);

      // Tenta navegar diretamente para a URL de logout
      const logoutUrl = config.logoutUrl || (new URL(config.loginUrl).origin + '/auth/logout');
      try {
        await page.goto(logoutUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(2000);
        log('ROBO', `[${config.nome}] Apos logout URL: ${page.url()}`);
      } catch {}

      // Se ainda nao foi pra pagina de login, tenta clicar no avatar e depois Sair
      if (!page.url().toLowerCase().includes('login')) {
        log('ROBO', `[${config.nome}] URL de logout nao redirecionou - tentando clicar em Sair...`);
        await page.evaluate(() => {
          const headerBtns = [...document.querySelectorAll('header button, nav button, header [role="button"]')];
          const lastBtn = headerBtns[headerBtns.length - 1];
          if (lastBtn) lastBtn.click();
        });
        await page.waitForTimeout(1500);
        await page.evaluate(() => {
          const els = [...document.querySelectorAll('*')];
          const sair = els.find(el => {
            if (el.children.length > 0) return false;
            const txt = (el.textContent || '').trim().toLowerCase();
            return txt === 'sair' || txt === 'logout' || txt === 'sign out' || txt === 'log out';
          });
          if (sair) (sair.closest('a') || sair.closest('button') || sair).click();
        });
        await page.waitForTimeout(2000);
      }

      log('ROBO', `[${config.nome}] Logout concluido! URL: ${page.url()}`);
    }
    // Vai para o formulario de login (sempre, apos logout ou se nao estava logado)
    if (!page.url().toLowerCase().includes('login')) {
      await page.goto(config.loginUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);
    }
    // Aguarda formulario aparecer (Cloudflare pode demorar)
    {
      // Aguarda formulario aparecer (Cloudflare pode demorar)
      let formularioOk = false;
      for (let i = 0; i < 12 && !formularioOk; i++) {
        await page.waitForTimeout(3000);
        const campo = await page.$(config.userSel).catch(() => null);
        if (campo) { formularioOk = true; break; }

        // Verificar se Cloudflare ja passou e redirecionou
        const urlAtual = page.url();
        if (!urlAtual.toLowerCase().includes('login') && !urlAtual.toLowerCase().includes('challenge')) {
          formularioOk = true; break;
        }

        // Tentar clicar checkbox Cloudflare (main page ou iframe)
        try {
          const cbMain = await page.$('input[type="checkbox"]');
          if (cbMain) { await cbMain.click(); log('ROBO', `[${config.nome}] Cloudflare clicado!`); }
        } catch {}
        for (const frame of page.frames()) {
          try {
            const cb = await frame.$('input[type="checkbox"]');
            if (cb) { await cb.click(); break; }
          } catch {}
        }
        log('ROBO', `[${config.nome}] Aguardando login... (${i + 1}/12)`);
      }

      if (!formularioOk) {
        return { ok: false, motivo: `Formulario de login nao apareceu - ${config.nome}`, intervencao: false };
      }

      const urlAntesPreencher = page.url().toLowerCase();
      if (urlAntesPreencher.includes('login') || urlAntesPreencher.includes('challenge')) {
        // Preenche login - simula digitacao humana
        const userField = await page.$(config.userSel);
        if (!userField) return { ok: false, motivo: `Campo usuario nao encontrado - ${config.nome}`, intervencao: true };
        await userField.click();
        await page.waitForTimeout(400);
        await userField.fill(username);

        // Pausa entre email e senha (como humano faria)
        await page.waitForTimeout(800);

        const passField = await page.$(config.passSel);
        if (!passField) return { ok: false, motivo: `Campo senha nao encontrado - ${config.nome}`, intervencao: true };
        await passField.click();
        await page.waitForTimeout(300);
        await passField.fill(senhaAntiga);

        await page.waitForTimeout(1000);
        const submitBtn = await page.$(config.submitSel);
        if (submitBtn) await submitBtn.click();
        else await page.keyboard.press('Enter');

        log('ROBO', `[${config.nome}] Login enviado...`);
        await page.waitForTimeout(5000);
      } else {
        log('ROBO', `[${config.nome}] Conta logada automaticamente, pulando envio do form...`);
      }

      // Verifica se logou (URL mudou)
      const urlFinal = page.url();
      if (urlFinal.includes('login') || urlFinal.includes('signin')) {
        const html = await page.content();
        if (html.toLowerCase().includes('invalid') || html.toLowerCase().includes('incorret') || html.toLowerCase().includes('errad') || html.toLowerCase().includes('credenciais')) {
          return { ok: false, motivo: `Senha antiga incorreta - ${config.nome}`, intervencao: true };
        }
      }
    }

    // TROCA DE SENHA
    const baseUrl = new URL(config.loginUrl).origin;
    let urlSenha = config.passwordChangeUrl;

    if (!urlSenha) {
      log('ROBO', `[${config.nome}] Buscando pagina de troca de senha...`);
      urlSenha = await encontrarUrlTrocaSenha(page, baseUrl);
    }

    if (!urlSenha) {
      return { ok: false, motivo: `Pagina de troca de senha nao encontrada - ${config.nome}`, intervencao: true };
    }

    log('ROBO', `[${config.nome}] Trocando senha em: ${urlSenha}`);
    await page.goto(urlSenha, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const sucesso = await trocarSenhaNaPagina(page, senhaAntiga, senhaNova);
    if (!sucesso) {
      log('ERRO', `[${config.nome}] Troca de senha falhou ou nao confirmada - verificar manualmente!`);
      return { ok: false, motivo: `Troca nao confirmada - ${config.nome}. Verifique manualmente`, intervencao: true };
    }
    log('ROBO', `[${config.nome}] ✅ SUCESSO! ${username} → ${senhaNova}`);
    return { ok: true, senhaNova };

  } catch (err) {
    log('ERRO', `[${config.nome}] ${err.message}`);
    return { ok: false, motivo: err.message, intervencao: false };
  } finally {
    if (page) await page.close().catch(() => {});
  }
}

// ── UnlockTool (especifico - tem Turnstile no formulario) ─

async function processarUnlockTool(task) {
  let { email: username, old_password: senhaAntiga } = task.payload || {};
  if (!username || !senhaAntiga) {
    return { ok: false, motivo: 'Dados incompletos no payload', intervencao: true };
  }
  
  username = username.trim();
  senhaAntiga = senhaAntiga.trim();

  const senhaNova = task.payload?.new_password || gerarSenha();
  log('ROBO', `[UnlockTool] Processando: ${username}`);

  const chromeOk = await abrirChromeSeNecessario();
  if (!chromeOk) return { ok: false, motivo: 'Chrome nao abriu', intervencao: true };

  let page = null;
  try {
    const browser = await chromium.connectOverCDP(CDP_URL);
    log('ROBO', '[UnlockTool] Conectado ao Chrome!');

    const context = browser.contexts()[0];
    page = await context.newPage();
    page.setDefaultTimeout(60000);

    log('ROBO', '[UnlockTool] Limpando cookies para forcar logout (garantindo conta certa)...');
    await context.clearCookies();
    await page.waitForTimeout(1000);

    await page.goto('https://unlocktool.net/post-in/', { waitUntil: 'domcontentloaded', timeout: 60000 });

    let formularioOk = false;
    for (let i = 0; i < 6 && !formularioOk; i++) {
      await page.waitForTimeout(3000);
      const temForm = await page.$('input[name="username"], input[type="text"], form input').catch(() => null);
      if (temForm) { formularioOk = true; break; }

      for (const frame of page.frames()) {
        try {
          const cb = await frame.$('input[type="checkbox"]');
          if (cb) { await cb.click(); break; }
        } catch {}
      }
      log('ROBO', `[UnlockTool] Aguardando... (${i + 1}/6)`);
      await page.waitForTimeout(8000);
    }

    if (!formularioOk) return { ok: false, motivo: 'Formulario UnlockTool nao apareceu', intervencao: false };

    const campoUser = await page.$('input[name="username"]') || await page.$('input[type="text"]');
    if (!campoUser) return { ok: false, motivo: 'Campo usuario nao encontrado', intervencao: true };
    await campoUser.fill(username);

    const camposSenha = await page.$$('input[type="password"]');
    if (!camposSenha.length) return { ok: false, motivo: 'Campo senha nao encontrado', intervencao: true };
    await camposSenha[0].fill(senhaAntiga);

    await page.waitForTimeout(3000);
    const btnLogin = await page.$('button[type="submit"]') || await page.$('input[type="submit"]');
    if (btnLogin) await btnLogin.click();
    else await page.keyboard.press('Enter');

    await page.waitForTimeout(5000);

    if (page.url().includes('post-in')) {
      const html = await page.content();
      if (html.includes('Invalid') || html.includes('incorret') || html.includes('errada')) {
        return { ok: false, motivo: 'Senha antiga incorreta', intervencao: true };
      }
    }

    await page.goto('https://unlocktool.net/password-change/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    const camposTroca = await page.$$('input[type="password"]');
    if (camposTroca.length < 2) return { ok: false, motivo: `Campos de troca nao encontrados`, intervencao: true };

    await camposTroca[0].fill(senhaAntiga);
    if (camposTroca[1]) await camposTroca[1].fill(senhaNova);
    if (camposTroca[2]) await camposTroca[2].fill(senhaNova);

    let btnClicado = false;
    const btnSalvar = await page.$('button[type="submit"], input[type="submit"]');
    if (btnSalvar) {
      await btnSalvar.click();
      btnClicado = true;
    } else {
      btnClicado = await page.evaluate(() => {
        const btns = [...document.querySelectorAll('button, input[type="button"], input[type="submit"], a.btn, [role="button"]')];
        const btn = btns.find(b => {
          const txt = (b.textContent || b.value || '').toLowerCase();
          return txt.includes('alterar') || txt.includes('change') || txt.includes('save') || txt.includes('salvar') || txt.includes('redefinir') || txt.includes('confirm');
        });
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      });
      if (!btnClicado) await page.keyboard.press('Enter');
    }
    log('ROBO', `[UnlockTool] Botao de salvar clicado/Enter pressionado`);
    await page.waitForTimeout(4000);

    const htmlApos = await page.content();
    const textoApos = htmlApos.toLowerCase();
    if (textoApos.includes('incorrect') || textoApos.includes('incorreta') || textoApos.includes('invalid') || textoApos.includes('error') || textoApos.includes('erro')) {
       log('ERRO', '[UnlockTool] Erro na hora de trocar a senha (provavel senha antiga incorreta).');
       return { ok: false, motivo: 'Erro ao trocar senha na UnlockTool. Verifique.', intervencao: true };
    }

    await page.goto('https://unlocktool.net/accounts/logout/', { timeout: 15000 }).catch(() => {});

    log('ROBO', `[UnlockTool] SUCESSO! ${username} → ${senhaNova}`);
    return { ok: true, senhaNova };

  } catch (err) {
    log('ERRO', `[UnlockTool] ${err.message}`);
    return { ok: false, motivo: err.message, intervencao: false };
  } finally {
    if (page) await page.close().catch(() => {});
  }
}

// ── Dispatcher: roteia tarefa para funcao correta ─────────

async function processarTarefa(task) {
  const toolKey = detectarFerramenta(task.service_title);
  if (!toolKey) {
    return { ok: false, motivo: `Ferramenta desconhecida: "${task.service_title}"`, intervencao: true };
  }

  let resultado;
  for (let tentativa = 1; tentativa <= 2; tentativa++) {
    if (toolKey === 'unlock') resultado = await processarUnlockTool(task);
    else resultado = await processarFerramenta(task, FERRAMENTAS[toolKey]);
    
    // Se deu certo ou se for um erro que exija intervencao manual (ex: senha antiga errada), para de tentar
    if (resultado.ok || resultado.intervencao) {
      break;
    }
    
    if (tentativa === 1) {
      log('ROBO', `[${FERRAMENTAS[toolKey]?.nome || 'UnlockTool'}] Falha transiente (ex: Cloudflare). Fechando e tentando de novo...`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
  
  return resultado;
}

// ── Sincroniza: cria tarefas para novas contas pending_reset ─

async function sincronizarTarefas() {
  try {
    // Buscar contas pending_reset
    const { data: pendentes } = await supabase
      .from('service_accounts')
      .select('id, service_id, credentials, status')
      .eq('status', 'pending_reset');

    if (!pendentes?.length) return;

    // Buscar tarefas ja existentes (pending ou running)
    const { data: tarefasExist } = await supabase
      .from('automation_tasks')
      .select('account_id')
      .in('status', ['pending', 'running']);

    const contasComTarefa = new Set((tarefasExist || []).map(t => t.account_id));

    // Buscar mapa de service_id -> title
    const { data: servicos } = await supabase.from('services').select('id, title');
    const mapaServico = {};
    (servicos || []).forEach(s => { mapaServico[s.id] = s.title; });

    let criadas = 0;
    for (const conta of pendentes) {
      if (contasComTarefa.has(conta.id)) continue;
      const email = conta.credentials?.email;
      const senha = conta.credentials?.password;
      const titulo = mapaServico[conta.service_id];
      if (!email || !senha || !titulo) continue;

      await supabase.from('automation_tasks').insert({
        account_id: conta.id,
        service_title: titulo,
        status: 'pending',
        attempts: 0,
        payload: { email, old_password: senha, target_site: titulo }
      });
      criadas++;
      log('INFO', `Nova tarefa criada automaticamente: ${titulo} | ${email}`);
    }

    if (criadas > 0) log('INFO', `${criadas} tarefa(s) nova(s) criada(s) automaticamente.`);
  } catch (e) {
    log('ERRO', `Erro ao sincronizar tarefas: ${e.message}`);
  }
}

// ── Loop principal ────────────────────────────────────────

async function ciclo() {
  await sincronizarTarefas(); // Cria tarefas para novas contas pending_reset
  log('INFO', 'Verificando tarefas...');
  let processados = 0;

  while (true) {
    const task = await buscarTarefa();

    if (!task) {
      if (processados === 0) log('INFO', 'Nenhuma tarefa pendente.');
      else log('INFO', `${processados} tarefa(s) processada(s) neste ciclo.`);
      break;
    }

    const toolKey = detectarFerramenta(task.service_title);
    log('INFO', `Tarefa [${processados + 1}]: ${task.service_title} | ${task.payload?.email || '?'} | ${FERRAMENTAS[toolKey]?.nome || '?'}`);

    // Verificar e buscar conta
    const { data: conta } = await supabase
      .from('service_accounts').select('*').eq('id', task.account_id).single();

    if (!conta) {
      log('AVISO', `Conta ${task.account_id} nao encontrada - pulando`);
      await supabase.from('automation_tasks')
        .update({ status: 'failed', error_message: 'Conta nao encontrada', updated_at: new Date().toISOString() })
        .eq('id', task.id);
      continue;
    }

    if (conta.status === 'rented') {
      log('AVISO', 'Conta alugada - pulando');
      await supabase.from('automation_tasks')
        .update({ status: 'skipped', error_message: 'Conta alugada', updated_at: new Date().toISOString() })
        .eq('id', task.id);
      continue;
    }

    if (conta.status !== 'pending_reset') {
      log('AVISO', `Status "${conta.status}" - nao precisa reset`);
      await supabase.from('automation_tasks')
        .update({ status: 'skipped', updated_at: new Date().toISOString() })
        .eq('id', task.id);
      continue;
    }

    // Completar payload com credenciais da conta se necessario
    if (!task.payload) task.payload = {};
    if (!task.payload.email && conta.credentials?.email) {
      task.payload.email = conta.credentials.email;
      log('INFO', `Email buscado da conta: ${task.payload.email}`);
    }
    if (!task.payload.old_password && conta.credentials?.password) {
      task.payload.old_password = conta.credentials.password;
      log('INFO', 'Senha antiga buscada da conta');
    }

    if (!task.payload.email || !task.payload.old_password) {
      log('ERRO', 'Sem credenciais na tarefa nem na conta - pulando');
      await marcarFalha(task, 'Credenciais nao encontradas', true);
      continue;
    }

    await marcarRodando(task.id);
    const resultado = await processarTarefa(task);

    if (resultado.ok) {
      await marcarSucesso(task.id);
      await atualizarConta(task.account_id, resultado.senhaNova, task.payload.email);
      log('OK', `✅ CONCLUIDO [${processados + 1}]: ${task.payload.email} → ${resultado.senhaNova}`);
    } else {
      await marcarFalha(task, resultado.motivo, resultado.intervencao);
      log('ERRO', `Falhou: ${resultado.motivo}`);
    }

    processados++;
    await new Promise(r => setTimeout(r, 5000));
  }
}

async function main() {
  log('INFO', '================================================');
  log('INFO', '  CENTRAL GSM - Worker Local (Multi-Tool)      ');
  log('INFO', '  UnlockTool | TSM | AMT | TFM | Cell | DFT   ');
  log('INFO', '================================================');
  log('INFO', `Verificando a cada ${INTERVALO_MS / 60000} minutos`);
  log('INFO', 'Chrome abre automaticamente quando necessario.');

  await ciclo().catch(e => log('ERRO', e.message));
  setInterval(() => ciclo().catch(e => log('ERRO', e.message)), INTERVALO_MS);
}

main().catch(err => { log('ERRO', `Fatal: ${err.message}`); process.exit(1); });
