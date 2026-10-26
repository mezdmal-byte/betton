@echo off
setlocal
cd /d "%~dp0"
echo BetTON Admin Center - setup local read-only viewer
if not exist ".venv-admin\Scripts\python.exe" (
  py -3 -m venv .venv-admin
  if errorlevel 1 (
    echo Python 3.11+ with the Windows Python Launcher is required.
    pause
    exit /b 1
  )
)
".venv-admin\Scripts\python.exe" -m pip install -r requirements-admin-center.txt
if errorlevel 1 exit /b 1
".venv-admin\Scripts\python.exe" -m admin_center.launcher --configure
if errorlevel 1 (
  pause
  exit /b 1
)
echo Setup complete. Use start-admin-center.bat
pause
