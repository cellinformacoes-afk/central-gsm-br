/**
 * =========================================================
 *  CENTRAL GSM — WORKER LOCAL (PC)
 *  Roda no seu PC usando Chrome REAL (bypassa Cloudflare)
 *  Processa APENAS tarefas UNLOCK TOOL
 * =========================================================
 */

const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { chromium } = require('playwright');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// ── Config ────────────────────────────────────────────────
const INTERVALO_MS   = 3 * 60 * 1000;  // verifica a cada 3 minutos
const MAX_TENTATIVAS = 4;
const SUPABASE_URL   = process.env.SUPABASE_URL;
const SUPABASE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERRO: Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no arquivo .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function log(nivel, msg) {
  const hora = new Date().toLocaleTimeString('pt-BR');
  const linha = `[${hora}] [${nivel}] ${msg}`;
  console.log(linha);
}

// ── Supabase helpers ──────────────────────────────────────

async function buscarTarefaUnlock() {
  const agora = new Date().toISOString();
  const { data, error } = await supabase
    .from('automation_tasks')
    .select('*')
    .eq('type', 'password_reset')
    .or('status.eq.pending,status.eq.running')
    .or(`next_retry_at.is.null,next_retry_at.lte.${agora}`)
    .order('created_at', { ascending: true })
    .limit(10);

  if (error) { log('ERRO', `Supabase: ${error.message}`); return null; }
  if (!data || data.length === 0) return null;
  return data.find(t => (t.service_title || '').toLowerCase().includes('unlock')) || null;
}

async function marcarRodando(taskId) {
  await supabase.from('automation_tasks')
    .update({ status: 'running', updated_at: new Date().toISOString() })
    .eq('id', taskId);
}

async function marcarSucesso(taskId) {
  await supabase.from('automation_tasks')
    .update({ status: 'done', updated_at: new Date().toISOString() })
    .eq('id', taskId);
}

async function marcarFalha(task, motivo, intervencao = false) {
  const tentativas = (task.attempts || 0) + 1;
  const novoStatus = (tentativas >= MAX_TENTATIVAS || intervencao)
    ? 'intervention_needed' : 'pending';

  let proximaTentativa = null;
  if (novoStatus === 'pending') {
    const delays = [5, 15, 60];
    const min = delays[tentativas - 1] || 60;
    proximaTentativa = new Date(Date.now() + min * 60 * 1000).toISOString();
    log('AVISO', `Retry em ${min}min (tentativa ${tentativas}/${MAX_TENTATIVAS})`);
  }

  await supabase.from('automation_tasks')
    .update({
      status: novoStatus,
      error_message: motivo,
      attempts: tentativas,
      next_retry_at: proximaTentativa,
      updated_at: new Date().toISOString()
    })
    .eq('id', task.id);

  if (novoStatus === 'intervention_needed') {
    log('AVISO', `INTERVENCAO: ${task.service_title} | ${task.payload?.email} | ${motivo}`);
  }
}

async function atualizarConta(accountId, senhaNova, emailConta) {
  const { error } = await supabase
    .from('service_accounts')
    .update({
      status: 'available',
      credentials: { email: emailConta, password: senhaNova },
      last_assigned_at: new Date().toISOString()
    })
    .eq('id', accountId);
  return !error;
}

function gerarSenha() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#';
  let s = '';
  for (let i = 0; i < 12; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

// ── Automacao Chrome REAL (sem proxy) ─────────────────────

async function processarUnlockTool(task) {
  const { email: username, old_password: senhaAntiga } = task.payload || {};
  if (!username || !senhaAntiga) {
    return { ok: false, motivo: 'Dados incompletos no payload', intervencao: true };
  }

  const senhaNova = task.payload?.new_password || gerarSenha();
  log('ROBO', `Processando: ${username}`);

  let browser = null;
  try {
    browser = await chromium.launch({
      headless: false,
      args: [
        '--window-position=50,50',
        '--window-size=1000,750',
        '--no-first-run',
        '--no-default-browser-check',
      ]
    });

    const context = await browser.newContext({
      locale: 'pt-BR',
      timezoneId: 'America/Sao_Paulo',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    });

    const page = await context.newPage();
    page.setDefaultTimeout(90000);

    // LOGIN
    log('ROBO', 'Abrindo unlocktool.net...');
    await page.goto('https://unlocktool.net/post-in/', { waitUntil: 'domcontentloaded', timeout: 60000 });

    log('ROBO', 'Aguardando formulario de login...');
    await page.waitForSelector('input[name="username"], input[type="text"], form input', { timeout: 90000 });

    const campoUser = await page.$('input[name="username"]') ||
                      await page.$('input[type="text"]') ||
                      await page.$('form input');
    if (!campoUser) return { ok: false, motivo: 'Campo usuario nao encontrado', intervencao: true };

    await campoUser.fill(username);

    const camposSenha = await page.$$('input[type="password"]');
    if (!camposSenha.length) return { ok: false, motivo: 'Campo senha nao encontrado', intervencao: true };
    await camposSenha[0].fill(senhaAntiga);

    log('ROBO', 'Aguardando Turnstile auto-resolver...');
    await page.waitForTimeout(3000);

    // Clica Login
    const btnLogin = await page.$('button[type="submit"]') ||
                     await page.$('input[type="submit"]') ||
                     await page.$('button:has-text("Login")');
    if (btnLogin) await btnLogin.click();
    else await page.keyboard.press('Enter');

    log('ROBO', 'Login enviado...');
    await page.waitForTimeout(5000);

    const urlAtual = page.url();
    if (urlAtual.includes('post-in')) {
      const html = await page.content();
      if (html.includes('Invalid') || html.includes('incorret') || html.includes('errada')) {
        return { ok: false, motivo: 'Senha antiga incorreta', intervencao: true };
      }
    }

    // TROCA DE SENHA
    log('ROBO', 'Navegando para password-change...');
    await page.goto('https://unlocktool.net/password-change/', { waitUntil: 'domcontentloaded', timeout: 30000 });

    const camposTroca = await page.$$('input[type="password"]');
    if (camposTroca.length < 2) {
      return { ok: false, motivo: `Campos de troca nao encontrados (titulo: ${await page.title()})`, intervencao: true };
    }

    await camposTroca[0].fill(senhaAntiga);
    if (camposTroca[1]) await camposTroca[1].fill(senhaNova);
    if (camposTroca[2]) await camposTroca[2].fill(senhaNova);

    const btnSalvar = await page.$('button[type="submit"]') ||
                      await page.$('input[type="submit"]') ||
                      await page.$('.btn-primary');
    if (btnSalvar) await btnSalvar.click();
    else await page.keyboard.press('Enter');

    await page.waitForTimeout(4000);

    const conteudo = await page.content();
    const sucesso = ['success', 'sucesso', 'alterada', 'changed', 'updated', 'atualizada', 'Password changed']
      .some(s => conteudo.toLowerCase().includes(s.toLowerCase()));

    log('ROBO', sucesso ? `Senha alterada! ${username} → ${senhaNova}` : 'Resultado incerto (assumindo sucesso)');
    return { ok: true, senhaNova };

  } catch (err) {
    log('ERRO', `Excecao: ${err.message}`);
    return { ok: false, motivo: err.message, intervencao: false };
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

// ── Loop principal ────────────────────────────────────────

async function ciclo() {
  log('INFO', 'Verificando tarefas UNLOCK TOOL...');

  const task = await buscarTarefaUnlock();
  if (!task) {
    log('INFO', 'Nenhuma tarefa pendente.');
    return;
  }

  log('INFO', `Tarefa: ${task.service_title} | ${task.payload?.email}`);

  if (task.account_id) {
    const { data: conta } = await supabase
      .from('service_accounts').select('status').eq('id', task.account_id).single();
    if (!conta || conta.status === 'rented') {
      log('AVISO', 'Conta alugada - pulando');
      await supabase.from('automation_tasks')
        .update({ status: 'skipped', error_message: 'Conta alugada', updated_at: new Date().toISOString() })
        .eq('id', task.id);
      return;
    }
    if (conta.status !== 'pending_reset') {
      log('AVISO', `Status "${conta.status}" - nao precisa reset`);
      await supabase.from('automation_tasks')
        .update({ status: 'skipped', updated_at: new Date().toISOString() })
        .eq('id', task.id);
      return;
    }
  }

  await marcarRodando(task.id);
  const resultado = await processarUnlockTool(task);

  if (resultado.ok) {
    await marcarSucesso(task.id);
    if (task.account_id) {
      await atualizarConta(task.account_id, resultado.senhaNova, task.payload?.email);
    }
    log('OK', `CONCLUIDO: ${task.payload?.email} | Nova senha: ${resultado.senhaNova}`);
  } else {
    await marcarFalha(task, resultado.motivo, resultado.intervencao);
    log('ERRO', `Falhou: ${resultado.motivo}`);
  }
}

async function main() {
  log('INFO', '================================================');
  log('INFO', '  CENTRAL GSM - Worker Local (Unlock Tool)      ');
  log('INFO', '  Chrome real + IP real = Cloudflare bypassed   ');
  log('INFO', '================================================');
  log('INFO', `Verificando a cada ${INTERVALO_MS / 60000} minutos`);

  await ciclo().catch(e => log('ERRO', e.message));
  setInterval(() => ciclo().catch(e => log('ERRO', e.message)), INTERVALO_MS);
}

main().catch(err => { log('ERRO', `Fatal: ${err.message}`); process.exit(1); });
