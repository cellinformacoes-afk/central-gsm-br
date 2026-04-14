/**
 * Utilitário simplificado para tratar desafios do Cloudflare / Turnstile
 */
async function handleCloudflare(page) {
  try {
    if (page.isClosed()) return false;
    
    // Pequena espera inicial
    await page.waitForTimeout(2000);

    // Detecção inicial
    const isChallenge = await page.evaluate(() => {
        const text = document.body.innerText;
        return text.includes('verificação de segurança') || 
               text.includes('Confirm you are human') || 
               text.includes('Verify you are human') ||
               !!document.querySelector('iframe[src*="challenges.cloudflare.com"]') ||
               !!document.querySelector('.cf-turnstile');
    }).catch(() => false);

    if (!isChallenge) return false;

    // Log estilo Blindado (igual ao print)
    for (let i = 1; i <= 5; i++) {
        console.log(`    > Aguardando Turnstile (${i}/5)...`);
        
        // Verifica se resolveu
        const isResolved = await page.evaluate(() => {
            const input = document.querySelector('[name="cf-turnstile-response"]');
            return input && input.value && input.value.length > 50;
        }).catch(() => false);

        if (isResolved) {
            console.log("    > Cloudflare resolvido!");
            return true;
        }

        // Tenta interagir
        const frames = page.frames();
        for (const frame of frames) {
            try {
                const url = frame.url() || "";
                if (url.includes('turnstile') || url.includes('challenges.cloudflare.com')) {
                    const frameElement = await frame.frameElement();
                    const box = await frameElement.boundingBox();
                    
                    if (box && box.width > 0) {
                        // Se estiver girando o loader do site e não o do cloudflare, recarregar
                        const isStuck = await page.evaluate(() => {
                           return !!(document.body.innerText.includes('Verificando se você é humano') && document.querySelector('.spinner, .loader, svg animate'));
                        }).catch(() => false);

                        if (isStuck && i >= 3) {
                             console.log("    > [ALERTA] Site parece travado no loader. Recarregando...");
                             await page.reload().catch(() => {});
                             return false;
                        }

                        console.log("    > [Ação] Click Cirúrgico Multi-Ponto...");
                        
                        // Clique 1: Onde costuma ficar o checkbox (Esquerda)
                        await page.mouse.click(box.x + 30, box.y + (box.height / 2), { delay: 100 });
                        await page.waitForTimeout(1500);

                        // Clique 2: Centro (Fallback)
                        await page.mouse.click(box.x + (box.width / 2), box.y + (box.height / 2), { delay: 100 });

                        await page.waitForTimeout(2000);
                        break;
                    }
                }
            } catch (e) {}
        }
        await page.waitForTimeout(5000);



    }

    return false;
  } catch (err) {
    return false;
  }
}






module.exports = { handleCloudflare };
