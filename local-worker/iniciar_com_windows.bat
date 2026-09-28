@echo off
echo Adicionando ao inicio automatico do Windows...
set STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set WORKER_PATH=%~dp0
set WORKER_BAT=%WORKER_PATH%start.bat

echo Set objShell = WScript.CreateObject("WScript.Shell") > "%TEMP%\create_shortcut.vbs"
echo Set objShortcut = objShell.CreateShortcut("%STARTUP%\CentralGSM-Worker.lnk") >> "%TEMP%\create_shortcut.vbs"
echo objShortcut.TargetPath = "%WORKER_BAT%" >> "%TEMP%\create_shortcut.vbs"
echo objShortcut.WorkingDirectory = "%WORKER_PATH%" >> "%TEMP%\create_shortcut.vbs"
echo objShortcut.WindowStyle = 7 >> "%TEMP%\create_shortcut.vbs"
echo objShortcut.Save >> "%TEMP%\create_shortcut.vbs"
cscript //nologo "%TEMP%\create_shortcut.vbs"
del "%TEMP%\create_shortcut.vbs"

echo.
echo Pronto! O worker vai iniciar automaticamente com o Windows.
echo Para testar agora, execute start.bat
pause
