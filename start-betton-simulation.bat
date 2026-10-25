@echo off
setlocal
cd /d "%~dp0"
title BetTON - full local simulation
if not exist ".venv\Scripts\python.exe" (
  echo Run install-simulation.bat first.
  pause
  exit /b 2
)
set "PYTHONUTF8=1"
set "PYTHONIOENCODING=utf-8"
".venv\Scripts\python.exe" scripts\simulation.py start --open
set "RC=%ERRORLEVEL%"
if not "%RC%"=="0" if not "%RC%"=="3" pause
exit /b %RC%
