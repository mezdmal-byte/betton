@echo off
setlocal
cd /d "%~dp0"
set "PYTHONUTF8=1"
set "PYTHONIOENCODING=utf-8"
title BetTON - isolated Telegram simulation
".venv\Scripts\python.exe" scripts\telegram_simulation.py start
set "RC=%ERRORLEVEL%"
if not "%RC%"=="0" if not "%RC%"=="3" pause
exit /b %RC%
