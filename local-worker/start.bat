@echo off
title Central GSM - Worker Unlock Tool
echo ================================================
echo   CENTRAL GSM - Worker Local Iniciando...
echo   Chrome vai abrir automaticamente para cada
echo   tarefa de Unlock Tool encontrada.
echo ================================================
echo.
SET PATH=%PATH%;C:\Program Files\nodejs
cd /d "%~dp0"
node index.js
pause
