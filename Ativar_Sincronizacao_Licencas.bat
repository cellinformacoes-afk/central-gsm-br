@echo off
title Sincronizador de Licencas CentralGSM
cd /d "%~dp0"

echo ======================================================
echo    SINCRONIZADOR DE LICENCAS (MODO CDP)
echo ======================================================
echo.
echo Iniciando o robo de sincronizacao...
echo Tentando conectar ao Chrome aberto (porta 9222)...
node scripts/sync-licenses.js

echo.
echo ======================================================
echo    PROCEDIMENTO CONCLUIDO! 🏁
echo ======================================================
pause
