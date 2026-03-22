@echo off
title Sincronizador Automatico CentralGSM
echo ==========================================================
echo    Sincronizador Automatico 100%% - Site CentralGSM
echo ==========================================================
echo Procurando o seu GitHub Desktop nos arquivos ocultos...

setlocal enabledelayedexpansion
set "GIT_EXE="
for /d %%I in ("%LOCALAPPDATA%\GitHubDesktop\app-*") do (
    if exist "%%I\resources\app\git\cmd\git.exe" (
        set "GIT_EXE=%%I\resources\app\git\cmd\git.exe"
    )
)

if not defined GIT_EXE (
    echo.
    echo [ERRO] Nao consegui encontrar o GitHub Desktop instalado.
    echo Por favor, faca o envio manualmente clicando no botao Push.
    pause
    exit /b
)

echo Sistema central encontrado com sucesso!
echo.
echo Esta tela preta envia as suas alteracoes para a internet 
echo sozinha, tudo no automatico a cada 20 segundos!
echo.
echo Quando voce terminar de trabalhar, basta FECHAR no X.
echo.
cd %~dp0

:loop
timeout /t 20 /nobreak > nul

for /f "delims=" %%a in ('"%GIT_EXE%" status --porcelain') do set HAS_CHANGES=1
if defined HAS_CHANGES (
    echo [%time%] Alteracao detectada! Enviando para o site oficial...
    "%GIT_EXE%" add .
    "%GIT_EXE%" commit -m "Auto-sync update: %time%"
    "%GIT_EXE%" push origin main
    set HAS_CHANGES=
    echo [%time%] Site atualizado na internet com sucesso!
    echo.
)
goto loop
