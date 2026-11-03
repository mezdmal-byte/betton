@echo off
setlocal
cd /d "%~dp0"
set "PYTHONUTF8=1"
set "PYTHONIOENCODING=utf-8"
if not exist ".venv\Scripts\python.exe" (
  echo Run install-simulation.bat first.
  pause
  exit /b 2
)
".venv\Scripts\python.exe" scripts\enrich_simulation.py --runtime simulation
set "RC=%ERRORLEVEL%"
pause
exit /b %RC%
