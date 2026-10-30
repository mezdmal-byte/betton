@echo off
setlocal
cd /d "%~dp0"
set "BETTON_TARGET_BRANCH=fix/visual-v1-wallet-shell-navigation-20261030"
echo BetTON Visual V1 test launcher - %BETTON_TARGET_BRANCH%
echo This runs the existing Telegram bot and backend, not the isolated simulation.
echo Check that your local database is backed up before placing test orders.
call "%~dp0start-betton-always-on.bat"
exit /b %ERRORLEVEL%
