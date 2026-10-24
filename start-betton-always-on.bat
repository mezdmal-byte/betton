@echo off
setlocal
cd /d "%~dp0"
title BetTON Always On
echo Starting BetTON...
echo.
if not exist "%~dp0start-betton-always-on.ps1" (
  echo ERROR: start-betton-always-on.ps1 was not found in this folder.
  echo.
  pause
  exit /b 1
)
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -NoExit -File "%~dp0start-betton-always-on.ps1"
echo.
echo PowerShell exited unexpectedly.
pause
endlocal
