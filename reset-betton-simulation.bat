@echo off
setlocal
cd /d "%~dp0"
".venv\Scripts\python.exe" -X utf8 scripts\simulation.py stop
if errorlevel 1 goto fail
".venv\Scripts\python.exe" -X utf8 scripts\simulation.py reset
if errorlevel 1 goto fail
call start-betton-simulation.bat
exit /b %ERRORLEVEL%
:fail
echo Reset refused. Previous data preserved.
pause
exit /b 2
