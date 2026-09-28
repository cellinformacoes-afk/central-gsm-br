@echo off
echo ============================
echo  Central GSM - Instalando
echo ============================
cd /d "%~dp0"
npm install
npx playwright install chromium
echo.
echo Instalacao concluida! Agora execute start.bat
pause
