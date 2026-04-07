@echo off
color 0A
title CENTRAL GSM - ROBO DE SENHAS (UNLOCK TOOL)
echo ==========================================================
echo INICIANDO O CEREBRO DIGITAL DO GERENCIADOR DE ESTOQUE
echo ==========================================================
echo.
echo Dica: Nao feche essa janela preta! Mimize-a para o Robo continuar trabalhando no fundo.
echo.
cd /d "%~dp0"
node scripts\robo_senhas.js
pause
