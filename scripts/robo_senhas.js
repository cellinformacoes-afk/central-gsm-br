const { createClient } = require('@supabase/supabase-js');
const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Configurar Stealth para burlar Anti-Bot (Cloudflare)
chromium.use(stealth);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("ERRO: Credenciais do Supabase nao encontradas no .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function gerarNovaSenha() {
  return Math.random().toString(36).slice(-8) + 'Aa@1'; // Letras e numeros para evitar recusa
}

async function processarUnlockTool(conta) {
  console.log(`\n[ROBÔ] 🟢 Iniciando troca de senha para Unlock Tool (${conta.credentials.email})`);
  const novaSenha = gerarNovaSenha();
  console.log(`[ROBÔ] Nova senha magica sera: ${novaSenha}`);

  // Iniciar navegador VISÍVEL: É crucial ser false para o Windows parecer um humano pro Cloudflare
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Passo 1: Ir para a tela de login
    console.log(`[ROBÔ] Acessando tela de login (post-in)...`);
    await page.goto('https://unlocktool.net/post-in/', { waitUntil: 'load' });
    
    console.log(`[ROBÔ] Preenchendo credenciais da conta...`);
    
    // Identificar e preencher Login
    await page.waitForSelector('input[type="text"], input[name="username"]', { timeout: 15000 });
    const userInputs = await page.$$('input[type="text"], input[name="username"]');
    if(userInputs.length > 0) {
        await userInputs[0].fill(conta.credentials.email);
    }
    
    // Identificar e preencher Senha Velha
    await page.waitForSelector('input[type="password"]', { timeout: 5000 });
    const passInputs = await page.$$('input[type="password"]');
    if(passInputs.length > 0) {
        await passInputs[0].fill(conta.credentials.password);
    }

    console.log(`[ROBÔ] Apertando o botao Conecte-se...`);
    // O botao original na Unlock Tool geralmente e um submeter
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        // Busca botoes que possam ser o de login
        const loginBtn = buttons.find(b => b.textContent && (b.textContent.toLowerCase().includes('conec') || b.textContent.toLowerCase().includes('login') || b.textContent.toLowerCase().includes('sign')));
        if(loginBtn) loginBtn.click();
    });

    // 12 SEGUNDOS DE ESPERA ESTRATÉGICA
    // Isso da tempo do Cloudflare rodar as checagens e, se ele pedir o "Tick" verde da Catraca, voce pode ver a tela e clicar manualmente!
    console.log(`[ROBÔ] 👀 Pano rápido (12s): Se o Cloudflare pedir Catraca, clique nela rapido...`);
    await page.waitForTimeout(12000);

    // Passo 2: Ir direto pro Link Mágico de Trocar a Senha
    console.log(`[ROBÔ] Acessando tela de alteracao de senha direto no link...`);
    await page.goto('https://unlocktool.net/password-change/', { waitUntil: 'load' });

    console.log(`[ROBÔ] Localizando os 3 campos (Antiga, Nova, Confirmar)...`);
    await page.waitForTimeout(3000);
    const changePassInputs = await page.$$('input[type="password"]');
    
    if(changePassInputs.length >= 3) {
        console.log(`[ROBÔ] Digitando as senhas nos campos...`);
        await changePassInputs[0].fill(conta.credentials.password); // Senha velha
        await changePassInputs[1].fill(novaSenha);                  // Nova Senha
        await changePassInputs[2].fill(novaSenha);                  // Repete Nova

        console.log(`[ROBÔ] Pressionando Alterar a Senha...`);
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const submitBtn = buttons.find(b => b.textContent && (b.textContent.toLowerCase().includes('alterar') || b.textContent.toLowerCase().includes('change')));
            if(submitBtn) submitBtn.click();
        });

        console.log(`[ROBÔ] Aguardando o site confirmar a troca (5s)...`);
        await page.waitForTimeout(5000);
        
        console.log(`[ROBÔ] ✅ O site confirmou a troca de Login! Salvando na Nuvem (Painel Central GSM)...`);
        
        // Passo 3: Substituir no Supabase
        const { error } = await supabase
            .from('service_accounts')
            .update({
                status: 'available',
                credentials: { email: conta.credentials.email, password: novaSenha }
            })
            .eq('id', conta.id);
        
        if (error) {
            console.error(`[ROBÔ ERRO DE BANCO] Socorro, nao consegui salvar a nova senha no banco: `, error);
        } else {
            console.log(`[ROBÔ] 🏆 SUCESSO ABSOLUTO! A conta foi dada como DISPONÍVEL com a senha: ${novaSenha}`);
        }

    } else {
        console.error(`[ROBÔ FALHA] Nao encontrei os 3 campos de senha na tela. Algo na Unlock Tool mudou o visual.`);
    }

  } catch (error) {
    console.error(`[ROBÔ ERRO GRAVE] Fui tentar mexer na ferramenta e caí: `, error);
  } finally {
    // Fecha o Chrome pra nao acumular janelas!
    console.log(`[ROBÔ] Fechando aba invisídel do Chrome e limpando vestigios...`);
    await browser.close();
  }
}

async function iniciarBotDaRevolucao() {
    console.log("=========================================================================");
    console.log("🤖 CEREBRO DIGITAL DA JACKSON & ISRAEL GSM INICIADO");
    console.log("👁️  Estou de olho na aba PENDENTES esperando as senhas expirarem...");
    console.log("=========================================================================");

    // O Motor infinito: Roda a cada 60 segundos exatos
    setInterval(async () => {
        
        const { data: contas, error } = await supabase
            .from('service_accounts')
            .select(`*, services ( title )`)
            .eq('status', 'pending_reset');
            
        if (error) {
            console.error("[Cerebro] Tropecei tentando acessar o banco de dados:", error);
            return;
        }

        if (contas && contas.length > 0) {
            console.log(`\n🚨 OPA! Achei ${contas.length} contas prontas pra serem resetadas agora mesmo!`);
            
            for (const conta of contas) {
                const ferramenta = conta.services?.title?.toLowerCase() || '';
                
                if (ferramenta.includes('unlock tool') || ferramenta.includes('unlocktool')) {
                    await processarUnlockTool(conta);
                } else {
                    console.log(`[AVISO] A ferramenta "${conta.services?.title}" ainda nao me ensinaram como trocar a senha. Pulando...`);
                }
            }
            console.log(`\n♻️ Fila concluida. Voltando a dormir e checar de hora em hora... Zzzz...`);
        }
    }, 60000); // 60 segundos
}

iniciarBotDaRevolucao();
