@echo off
setlocal
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" py -3 -m venv .venv
if errorlevel 1 goto fail
".venv\Scripts\python.exe" -m pip install -r requirements.txt
if errorlevel 1 goto fail
cd frontend
call npm.cmd ci --no-audit --no-fund
if errorlevel 1 goto fail
set "VITE_API_BASE_URL="
set "VITE_BASE_PATH=/v2/"
call npm.cmd run build
if errorlevel 1 goto fail
echo Installed. Open start-betton-simulation.bat.
pause
exit /b 0
:fail
echo Installation failed. Read the error above. No restart loop.
pause
exit /b 2
