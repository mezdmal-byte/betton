@echo off
setlocal
cd /d "%~dp0"
title Stop BetTON
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -Command ^
 "$run=Join-Path '%~dp0' '.betton-run';" ^
 "$pidFile=Join-Path $run 'watchdog.pid';" ^
 "if(Test-Path $pidFile){$wpid=(Get-Content $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1); if($wpid){Stop-Process -Id ([int]$wpid) -Force -ErrorAction SilentlyContinue}; Remove-Item $pidFile -Force -ErrorAction SilentlyContinue};" ^
 "try{$ls=Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue; foreach($l in $ls){if($l.OwningProcess){Stop-Process -Id $l.OwningProcess -Force -ErrorAction SilentlyContinue}}}catch{};" ^
 "Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue;" ^
 "Write-Host 'BetTON stopped.'"
echo.
pause
endlocal
