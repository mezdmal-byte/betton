@echo off
setlocal
cd /d "%~dp0"
echo BetTON UX v3 - isolated local test version. No production database or bot.
where py >nul 2>nul
if errorlevel 1 (
  echo Install Python 3.11 or newer with the Windows Python launcher.
  pause
  exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo Install Node.js LTS and reopen this launcher.
  pause
  exit /b 1
)
if not exist ".ux-preview\windows-venv\Scripts\python.exe" (
  py -3 -m venv ".ux-preview\windows-venv"
  if errorlevel 1 goto :failed
)
".ux-preview\windows-venv\Scripts\python.exe" -m pip install -r requirements.txt
if errorlevel 1 goto :failed
rem A slash resolves to same-origin and overrides any frontend .env API URL.
set "VITE_API_BASE_URL=/"
set "VITE_BASE_PATH=/v2/"
pushd frontend
call npm ci
if errorlevel 1 (
  popd
  goto :failed
)
call npm run build
if errorlevel 1 (
  popd
  goto :failed
)
popd
echo Open http://127.0.0.1:8877/sandbox/?actor=creator after startup.
echo Other accounts: actor=guarantor, actor=moderator, actor=participant
echo Local browser simulates the Telegram host. Actual Telegram is not connected.
".ux-preview\windows-venv\Scripts\python.exe" scripts\ux_v3_preview.py
if errorlevel 1 goto :failed
exit /b 0
:failed
echo Startup failed. Production BetTON was not changed. Read the error above.
pause
exit /b 1
