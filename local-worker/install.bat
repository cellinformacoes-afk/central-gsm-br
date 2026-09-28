@echo off
title Central GSM - Instalando
echo ============================
echo  Central GSM - Instalando
echo ============================
SET PATH=%PATH%;C:\Program Files\nodejs
cd /d "%~dp0"
call npm install
call npx playwright install chromium
echo.
echo Instalacao concluida! Agora execute start.bat
pause
