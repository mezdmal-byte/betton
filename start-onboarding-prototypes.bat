@echo off
setlocal
cd /d "%~dp0frontend"
title BetTON - isolated onboarding prototypes
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is missing. Install the existing frontend prerequisites first.
  pause
  exit /b 2
)
if not exist "node_modules\vite\bin\vite.js" (
  echo Frontend dependencies are missing. Run npm ci in frontend first.
  pause
  exit /b 2
)
echo Three isolated onboarding directions - no backend or real funds.
echo Open http://127.0.0.1:8886/prototypes/onboarding/index.html
echo Keys 1, 2, 3 select a direction. R replays. Use Ctrl+C here to stop.
echo A busy port is reported by Vite; no other process will be stopped.
node node_modules\vite\bin\vite.js --config vite.prototypes.config.ts
set "RC=%ERRORLEVEL%"
echo Prototype preview stopped. No app settings or balances were changed.
pause
exit /b %RC%
