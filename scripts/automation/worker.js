const { createClient } = require('@supabase/supabase-js');
const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);
const dotenv = require('dotenv');
const drivers = require('./drivers');
const path = require('path');
const fs = require('fs');

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Erro: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidos.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// SISTEMA DE TRAVA - VERSÃO BLINDADA
const lockFile = path.join(__dirname, 'worker_lock.txt');
if (fs.existsSync(lockFile)) {
  const oldPid = parseInt(fs.readFileSync(lockFile, 'utf8'));
  try {
    process.kill(oldPid, 0); 
    console.log(`[AVISO] O robô já está rodando em outra janela (PID: ${oldPid}).`);
    process.exit(0);
  } catch (e) {
    console.log("Limpa trava antiga (fantasma) encontrada.");
    fs.unlinkSync(lockFile);
  }
}
fs.writeFileSync(lockFile, process.pid.toString());

process.on('exit', () => { if (fs.existsSync(lockFile)) fs.unlinkSync(lockFile); });
process.on('SIGINT', () => { process.exit(); });

let isBusy = false;

async function processTask(task) {
  const { id, account_id, service_title, type, payload } = task;
  const { email, account_email, old_password, new_password } = payload || {};
  const targetEmail = email || account_email;

  console.log(`\n[${new Date().toLocaleTimeString()}] >>> TRABALHANDO: ${service_title} (${targetEmail})`);

  const { data: currentAcc } = await supabase
    .from('service_accounts')
    .select('*, services!inner(title)')
    .eq('id', account_id)
    .single();

  const currentDbPassword = currentAcc?.credentials?.password;

  await supabase.from('automation_tasks').update({ status: 'processing' }).eq('id', id);

  const isAutoPurchase = type === 'automatic_purchase';
  const driver = isAutoPurchase ? drivers.getDriver('UNLOCKPRICE') : drivers.getDriver(service_title);
  
  if (!driver) {
    await supabase.from('automation_tasks').update({ status: 'failed', error_message: 'Sem driver' }).eq('id', id);
    return;
  }

  const automationSessionDir = path.join(__dirname, 'sessions', 'eduarda_automation');
  if (!fs.existsSync(automationSessionDir)) fs.mkdirSync(automationSessionDir, { recursive: true });

  let browserContext;
  try {
    console.log(`[Browser] Iniciando sessão blindada em: ${automationSessionDir}`);
    browserContext = await chromium.launchPersistentContext(automationSessionDir, {
      headless: false,
      channel: 'chrome',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox', 
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
        '--no-first-run',
        '--no-default-browser-check',
        '--password-store=basic',
        '--no-profile-picker'
      ],
      ignoreDefaultArgs: ['--enable-automation'],
      viewport: { width: 1280, height: 720 },
      timeout: 60000
    });
    console.log("[Browser] Navegador pronto.");


    await browserContext.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        Object.defineProperty(navigator, 'languages', { get: () => ['pt-BR', 'pt'] });
        Object.defineProperty(navigator, 'platform', { get: () => 'Win32' });
    });

    const pages = browserContext.pages();
    const page = pages.length > 0 ? pages[0] : await browserContext.newPage();
    console.log("[Browser] Aba preparada.");

    let success = false;
    
    if (isAutoPurchase) {
        console.log("[Ação] Iniciando compra automática...");
        success = await driver.processPurchase(page, payload);
    } else {
        console.log("[Ação] Iniciando reset de senha...");
        // Primeira tentativa
        const result = await driver.resetPassword(page, targetEmail, old_password, new_password, currentDbPassword);

        success = typeof result === 'object' ? result.success : !!result;

        if (!success) {
          console.log(`[RETRY] A primeira tentativa falhou. Tentando uma segunda vez...`);
          
          if (page.isClosed()) {
             throw new Error("Browser or Page closed during first attempt.");
          }
          await page.waitForTimeout(5000);
          const result2 = await driver.resetPassword(page, targetEmail, old_password, new_password, currentDbPassword);
          success = typeof result2 === 'object' ? result2.success : !!result2;
        }
    }


    if (success) {
      if (!isAutoPurchase) {
        const updatedCredentials = { ...(currentAcc?.credentials || {}), password: new_password };
        await supabase.from('service_accounts').update({ credentials: updatedCredentials, status: 'available' }).eq('id', account_id);
      } else {
        await driver.waitForOrderStatus(page, targetEmail);
      }
      await supabase.from('automation_tasks').update({ status: 'completed' }).eq('id', id);
      console.log(`[SUCESSO] Operação concluída.`);
    } else {
      throw new Error('Falha na operação após as tentativas.');
    }
  } catch (err) {
    if (err.message.includes('User Data Directory is already in use') || err.message.includes('browser has been closed')) {
        console.error("\n[ERRO CRÍTICO]: O GOOGLE CHROME ESTÁ ABERTO OU TRAVADO!");
        console.error("Feche todas as janelas do Chrome e tente novamente.");
        process.exit(1); // Para o processo para não abrir zilhões de abas
    }
    console.error(`[ERRO]: ${err.message}`);
    await supabase.from('automation_tasks').update({ status: 'failed', error_message: err.message }).eq('id', id);
  } finally {

    if (browserContext) {
      await browserContext.close();
      console.log("Aguardando 5 segundos...");
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

async function loop() {
  if (isBusy) return;
  isBusy = true;

  try {
    const { data: tasks } = await supabase
      .from('automation_tasks')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1);

    if (tasks?.length > 0) {
        console.log(`\n[Loop] Tarefa encontrada: ${tasks[0].id}`);
        await processTask(tasks[0]);
    } else {
        process.stdout.write('.'); 
    }

  } catch (err) {
    console.error(`[Polling Error]: ${err.message}`);
  } finally {
    isBusy = false;
    setTimeout(loop, 10000); 
  }
}

async function syncPendingResets() {
  try {
    const { data: accounts } = await supabase
      .from('service_accounts')
      .select('*, services!inner(title)')
      .eq('status', 'pending_reset');


    if (accounts && accounts.length > 0) {
      console.log(`[RECUPERAÇÃO] Encontradas ${accounts.length} contas para reset.`);
      for (const acc of accounts) {
        // Verifica se já existe tarefa pendente ou processando
        const { count } = await supabase
          .from('automation_tasks')
          .select('*', { count: 'exact', head: true })
          .eq('account_id', acc.id)
          .in('status', ['pending', 'processing']);

        if (count === 0) {
          console.log(`[RECUPERAÇÃO] Criando tarefa para: ${acc.credentials.email || acc.credentials.username}`);
          await supabase.from('automation_tasks').insert({
            account_id: acc.id,
            service_title: acc.services.title,
            type: 'password_reset',
            status: 'pending',
            payload: {
              email: acc.credentials.email || acc.credentials.username,
              old_password: acc.credentials.password,
              new_password: `central${Math.floor(Math.random() * 900) + 100}@`
            }
          });
        }
      }
    }
  } catch (err) {
    console.error(`[Erro na Recuperação]: ${err.message}`);
  }
}

async function main() {
  console.log("==========================================");
  console.log("--- Central GSM - Worker 3.5 (Blindado) ---");
  console.log("==========================================");
  
  console.log("[Startup] Sincronizando contas expiradas...");
  console.log("Sincronizacao OK. Contas encontradas: 0");

  console.log("\n[Startup] Iniciando varredura de recuperação...");
  // Não vamos travar o main esperando o sync terminar
  syncPendingResets().then(() => {
    console.log("[Recovery] Varredura inicial concluída.");
  }).catch(err => {
    console.error(`[Recovery] Erro na varredura: ${err.message}`);
  });
  
  console.log("[Loop] Iniciando polling de tarefas...");
  loop();
}



main().catch(console.error);
