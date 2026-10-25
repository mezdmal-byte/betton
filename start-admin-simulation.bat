@echo off
setlocal
cd /d "%~dp0"
set "PYTHONUTF8=1"
if not exist ".venv\Scripts\python.exe" (
  echo Python environment missing. See ADMIN_CENTER_README_RU.md.
  pause
  exit /b 2
)
".venv\Scripts\python.exe" -m admin_center.simulation start %*
set "RC=%ERRORLEVEL%"
pause
exit /b %RC%
