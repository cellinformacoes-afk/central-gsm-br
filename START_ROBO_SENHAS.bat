@echo off
color 0A
title CENTRAL GSM - ROBO DE SENHAS (UNLOCK TOOL)

echo Verificando se as pecas do Robo estao instaladas...
if not exist "node_modules\@supabase\supabase-js" (
    echo Instalando motor de Banco de Dados e Navegador Invisivel...
    echo (Isso so acontece na primeira vez e pode demorar uns 2 minutinhos)
    call npm install
    call npx playwright install chromium
)

echo ==========================================================
echo INICIANDO O CEREBRO DIGITAL DO GERENCIADOR DE ESTOQUE
echo ==========================================================
echo.
echo Dica: Nao feche essa janela preta! Minimize-a para o Robo continuar no fundo.
echo.
node scripts\robo_senhas.js
pause
