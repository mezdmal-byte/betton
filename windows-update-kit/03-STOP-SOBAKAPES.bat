@echo off
setlocal
set "PROJECT=C:\Users\1\betton"
if not exist "%PROJECT%\stop-betton-always-on.bat" (
  echo ERROR: "%PROJECT%\stop-betton-always-on.bat" was not found.
  pause
  exit /b 1
)
echo Stopping local BetTON...
call "%PROJECT%\stop-betton-always-on.bat"
endlocal
