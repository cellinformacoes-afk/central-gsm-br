@echo off
set "SESSION_DIR=C:\Users\Usuario\Documents\sistema aluguel\scripts\automation\sync_browser_data"

echo ======================================================
echo    ABRINDO CHROME PARA LOGIN MANUAL (ROBO)
echo ======================================================
echo.
echo FECHANDO CHROMES ANTIGOS PARA EVITAR ERRO...
taskkill /F /IM chrome.exe /T >nul 2>&1
timeout /t 2 >nul

echo Tentando iniciar o Chrome...
echo Se o Chrome abrir e fechar, por favor leia a mensagem abaixo.
echo.

if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    set "CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe"
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    set "CHROME_PATH=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
) else if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    set "CHROME_PATH=%LocalAppData%\Google\Chrome\Application\chrome.exe"
)

if defined CHROME_PATH (
    echo Usando Chrome em: "%CHROME_PATH%"
    echo Limpando travas de sessao antigas...
    del /f /q "%SESSION_DIR%\SingletonLock" >nul 2>&1
    del /f /q "%SESSION_DIR%\lock" >nul 2>&1
    
    echo Abrindo navegador...
    "%CHROME_PATH%" --user-data-dir="%SESSION_DIR%" --remote-debugging-port=9222 --no-first-run "https://unlocktool.net/post-in/" "https://androidmultitool.com/controller/login" "https://tsm-tool.com/login" "https://tfmtool.com/login"
) else (
    echo [ERRO] Nao encontrei o Google Chrome em nenhum dos locais comuns.
    echo Por favor, me diga onde o seu Chrome esta instalado.
)

echo.
echo Se o Chrome NAO abriu, leia o erro acima.
pause
exit
