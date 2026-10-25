@echo off
setlocal
cd /d "%~dp0"
".venv\Scripts\python.exe" -X utf8 scripts\telegram_simulation.py stop
if errorlevel 1 pause
