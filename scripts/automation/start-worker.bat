@echo off
title Worker de Reset de Senha - Central GSM
echo ==========================================
echo    Central GSM - Iniciando Automação
echo ==========================================
echo.
cd /d %~dp0
node worker.js
pause
