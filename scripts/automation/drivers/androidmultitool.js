const { handleCloudflare } = require('../utils/cloudflare');

/**
 * Driver para AndroidMultiTool.com
 **/
async function resetPassword(page, email, oldPassword, newPassword, fallbackPassword) {
  try {
    console.log(`\n[ANDROID MULTI TOOL] Iniciando para ${email}...`);
    
    // Passo 2: Limpando tradução (Simulado via script)
    await page.addInitScript(() => {
        const style = document.createElement('style');
        style.innerHTML = '.goog-te-banner-frame, .skiptranslate, #goog-gt-{display:none !important;} body{top:0 !important;}';
        document.head.appendChild(style);
    });

    const isLogged = async () => {
      return await page.evaluate(() => {
          const text = document.body.innerText.toUpperCase();
          return !!(document.querySelector('a[href*="logout"]') || text.includes('LOGOUT') || text.includes('SAIR') || text.includes('DASHBOARD'));
      }).catch(() => false);
    };

    console.log(`... Passo 1: Carregando página`);
    await page.goto('https://androidmultitool.com/controller/dashboard', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
    
    console.log(`... Passo 2: Limpando tradução`);
    await page.evaluate(() => { document.documentElement.lang = 'en'; });

    console.log(`... Passo 3: Verificando Cloudflare`);
    await handleCloudflare(page);
    
    if (!(await isLogged())) {
        console.log(`... Passo 4: Verificando formulário`);
        await page.goto('https://androidmultitool.com/controller/login', { waitUntil: 'load' });
        await handleCloudflare(page);

        console.log(`... Passo 5: Preenchendo campos`);
        const emailSel = 'input#email';
        if (await page.$(emailSel)) {
            await page.fill(emailSel, email);
            await page.waitForTimeout(500);
            await page.fill('input[type="password"]', oldPassword);
            
            // Verificação extra antes de submeter (O segredo da Blindagem)
            await handleCloudflare(page);

            console.log(`... Passo 6: Submetendo`);
            await page.click('button[type="submit"], .btn-primary, button:has-text("Login")');
            await page.waitForTimeout(10000);
            await handleCloudflare(page);
        }

    }

    if (await isLogged()) {
        console.log(`... Passo 7: Aguardando resultado`);
        console.log("LOGADO com sucesso!");
        
        // Se precisar mudar senha (o print mostra que logou e depois mudou)
        console.log("Logado! Mudando a senha...");
        await page.goto('https://androidmultitool.com/controller/profile', { waitUntil: 'load' }).catch(() => {});
        
        console.log("... Rolando página para ativar Captcha...");
        await page.mouse.wheel(0, 400);
        await page.waitForTimeout(2000);
        
        const passFields = await page.$$('input[type="password"]');
        if (passFields.length >= 2) {
            console.log(`... Encontrados ${passFields.length} campos de senha.`);
            console.log("... Preenchendo campos de nova senha");
            await passFields[0].fill(oldPassword);
            await passFields[1].fill(newPassword);
            if (passFields[2]) await passFields[2].fill(newPassword);
            
            console.log("Pressionando SALVAR...");
            await page.click('button:has-text("Save"), button:has-text("Update"), .btn-success');
            console.log("... Botão clicado.");
            console.log("Aguardando confirmação de salvamento (10s)...");
            await page.waitForTimeout(10000);
            return { success: true };
        }
    }

    return { success: false };

  } catch (err) {
    console.error(`Erro no driver AMT: ${err.message}`);
    return false;
  }
}


module.exports = { resetPassword };
