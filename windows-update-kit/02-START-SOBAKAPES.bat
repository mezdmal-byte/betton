@echo off
setlocal
set "PROJECT=C:\Users\1\betton"
if not exist "%PROJECT%\start-betton-always-on.bat" (
  echo ERROR: "%PROJECT%\start-betton-always-on.bat" was not found.
  echo Recovery copy: windows-update-kit\recovery-launcher on GitHub.
  pause
  exit /b 1
)
echo Starting the existing BetTON Always On launcher...
call "%PROJECT%\start-betton-always-on.bat"
endlocal
