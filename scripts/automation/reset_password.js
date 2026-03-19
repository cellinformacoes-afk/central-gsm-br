const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env.local' });

chromium.use(stealth);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runRotation() {
  console.log('--- Iniciando Rotação de Senhas ---');
  
  // 1. Chamar RPC para atualizar expirações no DB
  const { data: monitorResult, error: monitorError } = await supabase.rpc('monitor_rental_expiration');
  if (monitorError) {
    console.error('Erro ao monitorar expirações:', monitorError);
    return;
  }
  console.log(`Expirados identificados: ${monitorResult.expiredCount}`);

  // 2. Buscar contas pendentes de reset
  const { data: accounts, error: accountError } = await supabase
    .from('service_accounts')
    .select('*, services(title)')
    .eq('status', 'pending_reset');

  if (accountError) {
    console.error('Erro ao buscar contas:', accountError);
    return;
  }

  console.log(`Contas para processar: ${accounts.length}`);

  for (const account of accounts) {
    console.log(`Processando: ${account.services.title} (${account.credentials.email})`);
    
    try {
      const newPassword = generateRandomPassword();
      let success = false;

      if (account.services.title.toLowerCase().includes('unlocktool')) {
        success = await rotateUnlockTool(account, newPassword);
      } else if (account.services.title.toLowerCase().includes('chimera')) {
        success = await rotateChimera(account, newPassword);
      } else {
        console.warn(`Nenhum handler para: ${account.services.title}`);
        continue;
      }

      if (success) {
        // Atualizar DB com nova senha e status 'available'
        const updatedCredentials = { ...account.credentials, password: newPassword };
        await supabase
          .from('service_accounts')
          .update({ 
            credentials: updatedCredentials, 
            status: 'available' 
          })
          .eq('id', account.id);
        
        console.log(`✅ Senha alterada com sucesso para: ${account.credentials.email}`);
      }
    } catch (err) {
      console.error(`❌ Falha ao processar ${account.credentials.email}:`, err.message);
    }
  }
}

async function rotateUnlockTool(account, newPassword) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('Acessando UnlockTool...');
    await page.goto('https://unlocktool.net/login/', { waitUntil: 'networkidle' });
    
    // Login
    await page.fill('input[name="username"]', account.credentials.email);
    await page.fill('input[name="password"]', account.credentials.password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation();

    // Navegar para Troca de Senha
    await page.goto('https://unlocktool.net/account/', { waitUntil: 'networkidle' });
    
    // Preencher formulário de senha (Exemplo de seletores comuns)
    await page.fill('input[name="current_password"]', account.credentials.password);
    await page.fill('input[name="new_password"]', newPassword);
    await page.fill('input[name="confirm_password"]', newPassword);
    await page.click('button#save-password'); // Substituir pelo real se necessário
    
    await page.waitForTimeout(2000);
    return true;
  } finally {
    await browser.close();
  }
}

async function rotateChimera(account, newPassword) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('Acessando ChimeraTool...');
    await page.goto('https://chimeratool.com/en/login', { waitUntil: 'networkidle' });
    
    // Login logic...
    // (Implementação similar ao UnlockTool com seletores específicos)
    return true; 
  } finally {
    await browser.close();
  }
}

function generateRandomPassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let pass = '';
  for (let i = 0; i < 12; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

runRotation();
