@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title BetTON - update from GitHub
echo ================================================
echo BetTON: safe update (React preview)
echo Source: feature/react-full-preview
echo Project: C:\Users\1\betton
echo ================================================
echo.
if not exist "%~dp0update-betton.ps1" (
  echo ERROR: update-betton.ps1 is missing.
  echo Keep 01-UPDATE-BETTON.bat and update-betton.ps1 together.
  pause
  exit /b 1
)
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0update-betton.ps1"
set "EXITCODE=%ERRORLEVEL%"
echo.
if not "%EXITCODE%"=="0" (
  echo Update DID NOT complete. Error code: %EXITCODE%.
  echo Do not start BetTON until you read the error above.
) else (
  echo Update finished. Start BetTON with your existing launcher.
)
echo.
pause
exit /b %EXITCODE%
