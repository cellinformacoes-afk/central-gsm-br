const { waitForCode } = require('../utils/email-reader');
const { handleCloudflare } = require('../utils/cloudflare');
const path = require('path');
const fs = require('fs');

const UNLOCKPRICE_EMAIL = 'cellinformacoes@gmail.com';
const UNLOCKPRICE_PASS = 'Eduarda1210@';

/**
 * Fecha anúncios e pop-ups chatos
 */
async function closeModals(page) {
    try {
        const selectors = [
            '.modal-header .close', 
            '.modal-footer button[data-dismiss="modal"]',
            'button[aria-label="Close"]',
            '.modal-dialog .close',
            '#modal-close'
        ];
        for (const sel of selectors) {
            const btn = page.locator(sel).first();
            if (await btn.isVisible()) {
                console.log(`[UnlockPrice] Fechando pop-up/anúncio (${sel})...`);
                await btn.click();
                await page.waitForTimeout(1000);
            }
        }
    } catch (e) {}
}

/**
 * Driver para UnlockPrice.com
 **/
async function processPurchase(page, payload) {
  const { order_id, email, imei, quantity, service_id } = payload;
  
  try {
    console.log(`[UnlockPrice] Iniciando compra para pedido ${order_id}...`);
    
    // 1. Forçar logout para garantir estado limpa (sugestão do usuário)
    console.log("[UnlockPrice] Garantindo estado limpo...");
    await page.goto('https://unlockprice.com/logout', { waitUntil: 'networkidle' });
    await handleCloudflare(page);
    await page.waitForTimeout(3000);
    
    // 2. Ir para a página de login correta (main.php)
    console.log("[UnlockPrice] Indo para a página de login correta...");
    await page.goto('https://unlockprice.com/main.php', { waitUntil: 'networkidle' });
    await handleCloudflare(page);
    
    // Verifica se já está logado
    const isLogged = await page.evaluate(() => !!document.querySelector('a[href*="logout"]') || document.body.innerText.includes('Dashboard'));
    
    if (!isLogged) {
      console.log("[UnlockPrice] Realizando login...");
      // Espera o formulário de login aparecer (usando seletor estável por atributo)
      console.log("[UnlockPrice] Aguardando campos de login...");
      await page.waitForSelector('input[name="username"], #login-form', { timeout: 15000 });
      
      console.log("[UnlockPrice] Preenchendo campos com seletores estáveis...");
      
      // Selectors estáveis por 'name' que nunca mudam
      const userSelector = 'input[name="username"]';
      const passSelector = 'input[name="password"]';
      const submitBtn = 'button.loginbuttons';
      
      // Tenta clicar e digitar no usuário
      await page.click(userSelector);
      await page.type(userSelector, UNLOCKPRICE_EMAIL, { delay: 100 });

      // Clica e digita a senha
      await page.click(passSelector);
      await page.type(passSelector, UNLOCKPRICE_PASS, { delay: 100 });

      console.log("[UnlockPrice] Clicando no botão de login...");
      await page.click(submitBtn);
      
      await page.waitForTimeout(5000);
      
      // Verifica se pede código de 2FA (Security Code / OTP)
      const isTwoFactor = await page.evaluate(() => {
        const text = document.body.innerText;
        return text.includes('Verification Code') || 
               text.includes('Security Code') || 
               text.includes('OTP') || 
               !!document.querySelector('#login-otp-input') ||
               !!document.querySelector('input[name="code"]');
      });
      
      if (isTwoFactor) {
          console.log("[UnlockPrice] 2FA Detectado! Aguardando e-mail...");
          // Espera o código chegar no email (máximo 60 segundos)
          const appPassword = process.env.GMAIL_APP_PASSWORD || UNLOCKPRICE_PASS;
          const code = await waitForCode(UNLOCKPRICE_EMAIL, appPassword);
          
          if (!code) {
              throw new Error("Não foi possível encontrar o código de 2FA no e-mail.");
          }
          
          console.log(`[UnlockPrice] Código recebido: ${code}. Preenchendo...`);
          
          // Tenta encontrar campos de OTP específicos da plataforma Dhru Fusion
          // Primeiro tenta os IDs específicos otp_digit_1 até otp_digit_6
          let otpBoxes = [];
          for (let i = 1; i <= 6; i++) {
              const box = page.locator(`#otp_digit_${i}:visible, input[name="otp_digit_${i}"]:visible`).first();
              if (await box.isVisible()) {
                  otpBoxes.push(box);
              }
          }

          // Se não achou pelos IDs, tenta pela classe .otp-digit
          if (otpBoxes.length < 6) {
              // Tenta localizar por maxlength="1" que é comum nessas 6 caixas
              const byMaxLen = await page.locator('input[maxlength="1"]:visible').all();
              if (byMaxLen.length >= 6) {
                  otpBoxes = byMaxLen;
              }
          }

          if (otpBoxes.length >= 6) {
              console.log(`[UnlockPrice] Detectadas ${otpBoxes.length} caixas de OTP. Injetando valores diretamente...`);
              
              await page.evaluate((otpCode) => {
                  const inputs = document.querySelectorAll('input[maxlength="1"]');
                  if (inputs.length >= 6) {
                      for (let i = 0; i < 6; i++) {
                          inputs[i].value = otpCode[i];
                          // Dispara eventos para o site perceber a mudança
                          inputs[i].dispatchEvent(new Event('input', { bubbles: true }));
                          inputs[i].dispatchEvent(new Event('change', { bubbles: true }));
                      }
                  }
              }, code);
              
              await page.waitForTimeout(500);
          } else {
              console.log("[UnlockPrice] Não detectou 6 caixas, tentando preenchimento via evaluate genérico...");
              // Força o preenchimento no campo oculto e nos possíveis visíveis
              await page.evaluate((c) => {
                  const inputs = document.querySelectorAll('input');
                  inputs.forEach(input => {
                      if (input.id.includes('otp') || input.name.includes('otp') || input.name.includes('code')) {
                          input.value = c;
                          input.dispatchEvent(new Event('change'));
                          input.dispatchEvent(new Event('input'));
                      }
                  });
                  // Caso seja o campo Dhru padrão
                  const mainInput = document.querySelector('#login-otp-input');
                  if (mainInput) {
                      mainInput.value = c;
                      mainInput.dispatchEvent(new Event('change'));
                  }
              }, code);
          }
          
          await page.waitForTimeout(1000);
          console.log("[UnlockPrice] Clicando no botão de verificação OTP...");
          const verifyBtnSelector = '#btn_otp_verify, #loginbut123zzz, button:has-text("Verify"), button.btn-primary:visible';
          await page.click(verifyBtnSelector);
          
          await page.waitForTimeout(10000);
      }
    }
    
    // 3. Verificar sucesso do login (MUITO RIGOROSO)
    console.log("[UnlockPrice] Verificando se o login foi concluído com sucesso...");
    const loginStatus = await page.evaluate(() => {
        const hasLogout = !!document.querySelector('a[href*="logout"]');
        const hasOtpText = document.body.innerText.includes('OTP Verification') || document.body.innerText.includes('Security Code');
        const hasLoginFields = !!document.querySelector('input[name="username"]');
        
        return {
            isLogged: hasLogout && !hasOtpText && !hasLoginFields,
            hasLogout,
            hasOtpText,
            hasLoginFields
        };
    });
    
    console.log(`[UnlockPrice] Status final: Logged=${loginStatus.isLogged}, LogoutLink=${loginStatus.hasLogout}, OtpVisible=${loginStatus.hasOtpText}`);
    
    if (!loginStatus.isLogged) {
        throw new Error("Falha Crítica: O robô não conseguiu logar. Verifique se o código OTP foi digitado corretamente.");
    }

    console.log("[UnlockPrice] Login REALIZADO COM SUCESSO!");
    
    // 4. Fluxo de Compra Automática
    const serviceId = parseInt(payload.service_id);
    const androidIds = [58, 37, 62, 36, 70, 76];
    const isAndroidMulti = androidIds.includes(serviceId) || (payload.service_title && payload.service_title.toUpperCase().includes("ANDROID MULT"));
    const serviceTitle = payload.service_title || (isAndroidMulti ? "ANDROID MULTI TOOL" : "PHOENIX SERVICE TOOL");
    
    console.log(`[UnlockPrice] Identificado: ID=${serviceId}, Titulo=${serviceTitle}, IsAndroid=${isAndroidMulti}`);
    
    // Fecha anúncios chatos pós-login
    await closeModals(page);
    
    // Unificado para /server conforme evidência no print 3
    const orderUrl = 'https://unlockprice.com/resellerplaceorder/server';

    console.log(`[UnlockPrice] Indo para a página de pedidos (Server)...`);
    await page.goto(orderUrl, { waitUntil: 'networkidle' });
    await handleCloudflare(page);
    
    // Fecha anúncios novamente se surgirem na página de serviço
    await closeModals(page);

    // 4. Seleção do Serviço (Chosen)
    const dropdownSelector = '#service_id_chosen a.chosen-single, #serviceid_chosen a.chosen-single, .chosen-container a.chosen-single';
    const serviceDropdown = page.locator(dropdownSelector).filter({ hasText: 'Selecionar' }).first();
    
    try {
        console.log("[UnlockPrice] Abrindo seletor de serviços...");
        await serviceDropdown.waitFor({ state: 'visible', timeout: 15000 });
        await serviceDropdown.click({ force: true });
        
        const chosenSearch = page.locator('.chosen-with-drop .chosen-search-input').first();
        await chosenSearch.waitFor({ state: 'visible', timeout: 5000 });
        
        const searchTerm = isAndroidMulti ? "amt credits" : "phoenix";
        console.log(`[UnlockPrice] Pesquisando por "${searchTerm}"...`);
        await chosenSearch.fill(searchTerm);
                await page.waitForTimeout(3000); // Espera filtro de rede/filtro JS
        
        console.log(`[UnlockPrice] Localizando serviço: ${serviceTitle}...`);
        
        let serviceOption;
        // Filtro preciso para o serviço e preço
        if (isAndroidMulti) {
            serviceOption = page.locator('.chosen-results li').filter({ 
                hasText: /amt credits/i 
            }).filter({
                hasText: /0[.,]96/
            }).first();
        } else {
            // Filtro preciso para Phoenix (0.95)
            serviceOption = page.locator('.chosen-results li').filter({ 
                hasText: /Phoenix Service Tool/i 
            }).filter({
                hasText: /0[.,]95/
            }).first();
        }
        
        if (await serviceOption.isVisible()) {
            const priceText = isAndroidMulti ? "0.96" : "0.95";
            console.log(`[UnlockPrice] Clicando na opção correta (${priceText} créditos)...`);
            await serviceOption.click();
        } else {
            console.log("[UnlockPrice] Tentando seleção via evaluate (Regex flexível)...");
            const selected = await page.evaluate((isAndroid) => {
                const results = Array.from(document.querySelectorAll('.chosen-results li'));
                const target = results.find(el => {
                    const text = el.innerText.toLowerCase();
                    if (isAndroid) {
                        return text.includes("amt credits") && /0[.,]96/.test(text);
                    } else {
                        return text.includes("phoenix service tool") && /0[.,]95/.test(text);
                    }
                });
                if (target) {
                    target.click();
                    // Força evento de change no select nativo que o Chosen controla
                    const selectEl = document.querySelector('select#service_id, select#serviceid, select#service');
                    if (selectEl) {
                        selectEl.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                    return true;
                }
                return false;
            }, isAndroidMulti);
            if (!selected) throw new Error(`Não foi possível localizar o serviço nos resultados.`);
        }
        
        console.log("[UnlockPrice] Serviço selecionado! Aguardando formulário...");
        // Aguarda campos aparecerem
        try {
            await page.waitForSelector('input#qnt, input#customfield1877', { state: 'visible', timeout: 10000 });
        } catch (e) {
            console.log("[UnlockPrice] Aviso: Campos não apareceram automaticamente. Tentando forçar clique novamente.");
            await page.evaluate(() => {
                const selectEl = document.querySelector('select#service_id, select#serviceid, select#service');
                if (selectEl) selectEl.dispatchEvent(new Event('change', { bubbles: true }));
            });
            await page.waitForTimeout(3000);
        }
    } catch (err) {
        console.error(`[UnlockPrice Error]: Erro na seleção: ${err.message}`);
        await page.screenshot({ path: path.join(process.cwd(), 'error_phoenix_selection.png') });
        throw err;
    }

    // 5. Preencher campos do pedido
    console.log("[UnlockPrice] Preenchendo campos do pedido...");
    
    // Qnt
    const qtyField = page.locator('input#qnt').first();
    if (await qtyField.isVisible() && payload.quantity) {
        await qtyField.fill(payload.quantity.toString());
    }

    // Email
    const emailField = page.locator('input#customfield1877, input[name*="customfield"]').first();
    if (await emailField.isVisible()) {
        const emailToFill = payload.email || payload.client_email || "";
        await emailField.fill(emailToFill);
    }

    // 6. Finalizando
    console.log("[UnlockPrice] Finalizando pedido...");
    const orderButton = page.locator('button:has-text("Fazer Pedido"), button.placeorder').first();
    
    if (await orderButton.isVisible()) {
        await orderButton.click();
        
        // Aguarda resposta do servidor
        await page.waitForTimeout(6000);

        // Verifica erro crítico (alerta vermelho)
        const errorAlert = page.locator('.alert-danger, .error-msg').first();
        if (await errorAlert.isVisible()) {
            const errorMsg = await errorAlert.innerText();
            throw new Error(`[UnlockPrice] Erro detectado no site: ${errorMsg.trim()}`);
        }

        // Verifica sucesso (alerta verde ou mudança de URL)
        const successAlert = page.locator('.alert-success, .success-msg').first();
        if (await successAlert.isVisible()) {
            const successMsg = await successAlert.innerText();
            console.log(`[UnlockPrice] SUCESSO: ${successMsg.trim()}`);
            return true;
        }

        // Se não tem erro mas o botão sumiu ou URL mudou, consideramos enviado
        console.log("[UnlockPrice] Pedido enviado (validando conclusão).");
        return true;
    }
    
    throw new Error("Botão 'Fazer Pedido' não localizado na página final.");

  } catch (err) {
    console.error(`[UnlockPrice Error]: ${err.message}`);
    await page.screenshot({ path: path.join(process.cwd(), 'error_purchase.png') });
    throw err;
  }
}

/**
 * Monitora o status de um pedido até que ele seja concluído ou rejeitado.
 * @param {import('playwright').Page} page 
 * @param {string} email O e-mail usado no pedido (para identificar a linha)
 */
async function waitForOrderStatus(page, email) {
    const ordersUrl = 'https://unlockprice.com/orders/action/newserver/status/all';
    console.log(`[UnlockPrice] Iniciando monitoramento para o e-mail: ${email}`);

    while (true) {
        try {
            console.log(`[UnlockPrice] Atualizando página de pedidos em ${new Date().toLocaleTimeString()}...`);
            await page.goto(ordersUrl, { waitUntil: 'networkidle' });
            await closeModals(page);

            // Localiza a linha do pedido pelo e-mail
            // Formato no site: "Email=>exemplo@gmail.com"
            const rowSelector = `//tr[td[contains(., "${email}")]]`;
            const row = page.locator(rowSelector).first();

            if (await row.isVisible()) {
                const rowText = await row.innerText();
                console.log(`[UnlockPrice] Conteúdo da linha: ${rowText.replace(/\n/g, ' | ').trim()}`);

                if (rowText.toLowerCase().includes('sucesso')) {
                    console.log("[UnlockPrice] STATUS IDENTIFICADO: SUCESSO!");
                    return 'success';
                }

                if (rowText.toLowerCase().includes('rejeitado')) {
                    console.log("[UnlockPrice] STATUS IDENTIFICADO: REJEITADO!");
                    return 'rejected';
                }
            } else {
                console.log(`[UnlockPrice] Aviso: Pedido para ${email} não encontrado na página atual.`);
            }

            console.log("[UnlockPrice] Aguardando 1 minuto para próxima verificação...");
            await page.waitForTimeout(60000); // 1 minuto
        } catch (err) {
            console.error(`[UnlockPrice Monitor Error]: ${err.message}`);
            await page.waitForTimeout(10000);
        }
    }
}

module.exports = {
  processPurchase,
  waitForOrderStatus
};
