@echo off
echo Finalizando todos os processos do Google Chrome...
taskkill /F /IM chrome.exe /T >nul 2>&1
echo Limpando travas de perfil...
if exist "C:\Users\Usuario\AppData\Local\Google\Chrome\User Data\SingletonLock" del /f /q "C:\Users\Usuario\AppData\Local\Google\Chrome\User Data\SingletonLock"
if exist "C:\Users\Usuario\AppData\Local\Google\Chrome\User Data\Profile 1\SingletonLock" del /f /q "C:\Users\Usuario\AppData\Local\Google\Chrome\User Data\Profile 1\SingletonLock"
echo.
echo Pronto! Agora o Google Chrome esta 100%% liberado.
echo Ja pode ligar o robo.
pause

