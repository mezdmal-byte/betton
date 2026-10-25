@echo off
setlocal
cd /d "%~dp0"
if not exist ".venv-admin\Scripts\python.exe" (
  echo Run setup-admin-center.bat first.
  pause
  exit /b 1
)
".venv-admin\Scripts\python.exe" -m admin_center.launcher
if errorlevel 1 pause
