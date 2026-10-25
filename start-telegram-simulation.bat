@echo off
setlocal
cd /d "%~dp0"
set "PYTHONUTF8=1"
set "PYTHONIOENCODING=utf-8"
title BetTON - isolated Telegram simulation
if not exist ".venv\Scripts\python.exe" (
  echo Python environment is missing. Run install-simulation.bat first.
  pause
  exit /b 2
)
".venv\Scripts\python.exe" scripts\telegram_simulation.py start
set "RC=%ERRORLEVEL%"
if "%RC%"=="3" echo BetTON SIM is already running. Open the BetTON SIM menu in SobakaPesBot.
if not "%RC%"=="0" if not "%RC%"=="3" echo Start failed. See .ux-preview\telegram-simulation-runtime\launcher.log
echo This window will stay open so you can read the result.
pause
exit /b %RC%
