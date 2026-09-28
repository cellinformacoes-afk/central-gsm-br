@echo off
echo ================================================
echo  CENTRAL GSM - Chrome para Automacao
echo ================================================
echo.
echo Abrindo Google Chrome com porta de debug...
echo.
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
  start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="%~dp0chrome-real-profile" --no-first-run --no-default-browser-check --window-size=1000,750 --window-position=50,50 "https://unlocktool.net/post-in/"
  goto AGUARDAR
)
echo ERRO: Chrome nao encontrado!
pause
exit
:AGUARDAR
echo Chrome abrindo em unlocktool.net...
echo.
echo SE APARECER "Confirme que e humano": CLIQUE NO CHECKBOX!
echo Depois execute start.bat para iniciar o worker.
echo.
pause
