@echo off
setlocal
cd /d "%~dp0"
set "PYTHONUTF8=1"
if not exist ".venv\Scripts\python.exe" (
  echo Project Python environment is missing.
  pause
  exit /b 2
)
".venv\Scripts\python.exe" scripts\check_dev.py %*
set "RC=%ERRORLEVEL%"
echo Checks finished with code %RC%. No installation or deployment was performed.
pause
exit /b %RC%
