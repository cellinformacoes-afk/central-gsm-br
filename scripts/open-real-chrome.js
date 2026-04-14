const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

async function openRealChrome() {
    console.log("\n======================================================");
    console.log("   ESTRATÉGIA FINAL: CHROME REAL (ZERO AUTOMAÇÃO)   ");
    console.log("======================================================\n");
    console.log("Como os sites estão bloqueando o 'robô', vamos usar");
    console.log("o seu Chrome normal para enganar eles.");
    
    const sessionDir = path.join(__dirname, 'automation', 'sync_browser_data');
    if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
    }

    // Comando para abrir o Chrome real do Windows na nossa pasta de sessão
    // Isso garante que NENHUMA flag de "robô" seja enviada.
    const chromePath = 'start chrome'; 
    const args = `"${sessionDir}" --window-size=1280,800`;
    
    console.log("1. Vou abrir o Chrome agora...");
    console.log("2. Faça o login no AMT, UnlockTool e TSM.");
    console.log("3. Resolva o Captcha (agora vai funcionar 100%!).");
    console.log("4. Depois de logado, FECHE O NAVEGADOR para o robô assumir.");

    // Comando do Windows para carregar o perfil do robô no Chrome real
    const command = `${chromePath} --user-data-dir="${sessionDir}" "https://unlocktool.net/post-in/" "https://androidmultitool.com/controller/login" "https://tsm-tool.com/login"`;

    exec(command, (err) => {
        if (err) {
            console.error("\n❌ Erro ao abrir o Chrome. Tente abrir manualmente com este comando no CMD:");
            console.log(command);
            return;
        }
        console.log("\n[OK] Chrome aberto. Aguardando você fazer os logins...");
    });
}

openRealChrome();
