$ErrorActionPreference = "Stop"

function Write-Section([string]$Text) {
    Write-Host ""
    Write-Host "============================================================"
    Write-Host $Text
    Write-Host "============================================================"
}

function Test-Http([string]$Url, [int]$TimeoutSec = 5) {
    try {
        $r = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec $TimeoutSec
        return ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500)
    } catch {
        return $false
    }
}

function Wait-Http([string]$Url, [int]$Seconds) {
    $until = (Get-Date).AddSeconds($Seconds)
    while ((Get-Date) -lt $until) {
        if (Test-Http $Url 4) { return $true }
        Start-Sleep -Seconds 2
    }
    return $false
}

function Read-EnvValue([string]$EnvFile, [string]$Key) {
    if (-not (Test-Path $EnvFile)) { return $null }
    $escaped = [regex]::Escape($Key)
    $line = Get-Content -LiteralPath $EnvFile |
        Where-Object { $_ -match "^\s*$escaped\s*=" } |
        Select-Object -Last 1
    if (-not $line) { return $null }
    return (($line -replace "^\s*$escaped\s*=\s*", "").Trim().Trim('"').Trim("'"))
}

function Write-EnvValue([string]$EnvFile, [string]$Key, [string]$Value) {
    $lines = New-Object System.Collections.Generic.List[string]
    if (Test-Path $EnvFile) {
        foreach ($line in (Get-Content -LiteralPath $EnvFile)) {
            [void]$lines.Add($line)
        }
    }

    $escaped = [regex]::Escape($Key)
    $found = $false
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match "^\s*$escaped\s*=") {
            $lines[$i] = "$Key=$Value"
            $found = $true
        }
    }
    if (-not $found) {
        [void]$lines.Add("$Key=$Value")
    }

    $enc = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllLines($EnvFile, $lines, $enc)
}

function Stop-Backend([int]$Port) {
    try {
        $listeners = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        foreach ($l in $listeners) {
            if ($l.OwningProcess) {
                Stop-Process -Id $l.OwningProcess -Force -ErrorAction SilentlyContinue
            }
        }
    } catch {
        # Best effort only.
    }
}

function Start-Backend(
    [string]$Python,
    [string]$ProjectDir,
    [int]$Port,
    [string]$OutLog,
    [string]$ErrLog
) {
    Stop-Backend $Port
    Start-Sleep -Milliseconds 500

    Remove-Item -LiteralPath $OutLog -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $ErrLog -Force -ErrorAction SilentlyContinue

    Start-Process `
        -FilePath $Python `
        -ArgumentList @("-m","uvicorn","app.main:app","--host","127.0.0.1","--port",[string]$Port) `
        -WorkingDirectory $ProjectDir `
        -WindowStyle Hidden `
        -RedirectStandardOutput $OutLog `
        -RedirectStandardError $ErrLog | Out-Null

    $health = "http://127.0.0.1:$Port/health"
    if (-not (Wait-Http $health 30)) {
        Write-Host ""
        Write-Host "Uvicorn log:"
        if (Test-Path $ErrLog) { Get-Content -LiteralPath $ErrLog -Tail 50 }
        throw "Backend did not start on $health"
    }
}

function Get-Cloudflared {
    $cmd = Get-Command cloudflared.exe -ErrorAction SilentlyContinue
    if (-not $cmd) { $cmd = Get-Command cloudflared -ErrorAction SilentlyContinue }
    if ($cmd) { return $cmd.Source }

    $local = Join-Path $script:ProjectDir "cloudflared.exe"
    if (Test-Path $local) { return $local }

    throw "cloudflared was not found. Put cloudflared.exe in the project folder or install it in PATH."
}

function Stop-Tunnel {
    Get-Process cloudflared -ErrorAction SilentlyContinue |
        Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 800
}

function Find-TunnelUrl([string]$OutLog, [string]$ErrLog) {
    $text = ""
    if (Test-Path $OutLog) { $text += (Get-Content -LiteralPath $OutLog -Raw -ErrorAction SilentlyContinue) }
    if (Test-Path $ErrLog) { $text += "`n" + (Get-Content -LiteralPath $ErrLog -Raw -ErrorAction SilentlyContinue) }

    $m = [regex]::Match(
        $text,
        "https://[a-z0-9-]+\.trycloudflare\.com",
        [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
    )
    if ($m.Success) { return $m.Value.ToLowerInvariant() }
    return $null
}

function Start-Tunnel(
    [string]$Cloudflared,
    [int]$Port,
    [string]$ProjectDir,
    [string]$OutLog,
    [string]$ErrLog
) {
    Stop-Tunnel
    Remove-Item -LiteralPath $OutLog -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $ErrLog -Force -ErrorAction SilentlyContinue

    $proc = Start-Process `
        -FilePath $Cloudflared `
        -ArgumentList @("tunnel","--url","http://127.0.0.1:$Port") `
        -WorkingDirectory $ProjectDir `
        -WindowStyle Hidden `
        -RedirectStandardOutput $OutLog `
        -RedirectStandardError $ErrLog `
        -PassThru

    $deadline = (Get-Date).AddSeconds(45)
    while ((Get-Date) -lt $deadline) {
        $url = Find-TunnelUrl $OutLog $ErrLog
        if ($url) { return $url }

        if ($proc.HasExited) {
            Write-Host ""
            Write-Host "cloudflared exited. Log:"
            if (Test-Path $ErrLog) { Get-Content -LiteralPath $ErrLog -Tail 60 }
            throw "cloudflared exited before a Quick Tunnel URL was created."
        }
        Start-Sleep -Seconds 1
    }

    Write-Host ""
    Write-Host "cloudflared log:"
    if (Test-Path $ErrLog) { Get-Content -LiteralPath $ErrLog -Tail 60 }
    throw "Timed out waiting for Quick Tunnel URL."
}

function Update-GitSafely([string]$TargetBranch) {
    if (-not (Test-Path (Join-Path $script:ProjectDir ".git"))) {
        Write-Host "No .git folder; skipping Git update."
        return
    }

    $current = (& git branch --show-current 2>$null | Select-Object -First 1)
    if ($null -eq $current) { $current = "" }
    $current = ([string]$current).Trim()

    $dirty = @(& git status --porcelain --untracked-files=no 2>$null)

    if ($current -ne $TargetBranch) {
        if ($dirty.Count -gt 0) {
            throw "Tracked local changes exist on branch '$current'. Refusing automatic branch switch."
        }

        Write-Host "Switching to $TargetBranch ..."
        & git fetch origin $TargetBranch
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Remote $TargetBranch not available yet; using the local branch if present."
        }

        & git switch $TargetBranch
        if ($LASTEXITCODE -ne 0) { throw "git switch failed." }
    }

    $dirty = @(& git status --porcelain --untracked-files=no 2>$null)
    if ($dirty.Count -eq 0) {
        Write-Host "Updating $TargetBranch with ff-only ..."
        & git pull --ff-only origin $TargetBranch
        if ($LASTEXITCODE -ne 0) {
            Write-Host "WARNING: git pull failed; continuing with the current local commit."
        }
    } else {
        Write-Host "Tracked local changes exist; git pull skipped."
    }

    $head = (& git rev-parse HEAD 2>$null | Select-Object -First 1)
    Write-Host "HEAD: $head"
}

function Ensure-ReactPreview([string]$ProjectDir) {
    $frontend = Join-Path $ProjectDir "frontend"
    $distIndex = Join-Path $frontend "dist\index.html"
    $srcDir = Join-Path $frontend "src"
    if (-not (Test-Path $frontend)) {
        throw "frontend/ was not found. React preview cannot be built."
    }

    $needBuild = -not (Test-Path $distIndex)
    if (-not $needBuild) {
        $distTime = (Get-Item $distIndex).LastWriteTimeUtc
        $candidates = @()
        $watchFiles = @(
            (Join-Path $frontend "index.html"),
            (Join-Path $frontend "package.json"),
            (Join-Path $frontend "package-lock.json"),
            (Join-Path $frontend "vite.config.ts")
        )
        foreach ($path in $watchFiles) {
            if (Test-Path -LiteralPath $path) {
                $candidates += Get-Item -LiteralPath $path
            }
        }
        if (Test-Path $srcDir) {
            $candidates += Get-ChildItem -Path $srcDir -Recurse -File -ErrorAction SilentlyContinue
        }
        $newest = $candidates | Sort-Object LastWriteTimeUtc -Descending | Select-Object -First 1
        if ($newest -and $newest.LastWriteTimeUtc -gt $distTime) {
            $needBuild = $true
        }
    }

    if ($needBuild) {
        Write-Host "Building React preview into frontend/dist ..."
        Push-Location $frontend
        try {
            if (-not (Test-Path (Join-Path $frontend "node_modules"))) {
                npm install
                if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
            }
            npm run build
            if ($LASTEXITCODE -ne 0) { throw "npm run build failed in frontend/" }
        } finally {
            Pop-Location
        }
    }

    if (-not (Test-Path $distIndex)) {
        throw "frontend/dist/index.html is missing. From frontend/ run: npm run build"
    }
}

try {
    $script:ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    Set-Location -LiteralPath $script:ProjectDir

    $TargetBranch = "feature/react-full-preview"
    $Port = 8000
    $EnvFile = Join-Path $script:ProjectDir ".env"
    $Python = Join-Path $script:ProjectDir ".venv\Scripts\python.exe"
    $RunDir = Join-Path $script:ProjectDir ".betton-run"
    $BackendOut = Join-Path $RunDir "uvicorn.out.log"
    $BackendErr = Join-Path $RunDir "uvicorn.err.log"
    $TunnelOut = Join-Path $RunDir "cloudflared.out.log"
    $TunnelErr = Join-Path $RunDir "cloudflared.err.log"

    New-Item -ItemType Directory -Force -Path $RunDir | Out-Null
    Set-Content -LiteralPath (Join-Path $RunDir "watchdog.pid") -Value $PID -Encoding ascii

    Write-Section "BetTON always-on launcher v2"

    if (-not (Test-Path $EnvFile)) { throw ".env not found: $EnvFile" }
    if (-not (Test-Path $Python)) { throw ".venv Python not found: $Python" }

    Update-GitSafely $TargetBranch
    Ensure-ReactPreview $script:ProjectDir

    $cloudflared = Get-Cloudflared
    $currentUrl = Read-EnvValue $EnvFile "PUBLIC_BASE_URL"
    $tunnelRunning = @(Get-Process cloudflared -ErrorAction SilentlyContinue).Count -gt 0

    if ($tunnelRunning -and $currentUrl -and $currentUrl -match "^https://[a-z0-9-]+\.trycloudflare\.com/?$") {
        Write-Host "Keeping existing Quick Tunnel:"
        Write-Host $currentUrl

        # Backend is restarted to load the current branch, while cloudflared is kept alive.
        Start-Backend $Python $script:ProjectDir $Port $BackendOut $BackendErr

        if (-not (Wait-Http ($currentUrl.TrimEnd("/") + "/health") 30)) {
            Write-Host "Existing tunnel process is unhealthy; replacing it."
            $currentUrl = Start-Tunnel $cloudflared $Port $script:ProjectDir $TunnelOut $TunnelErr

            Write-EnvValue $EnvFile "PUBLIC_BASE_URL" $currentUrl
            Write-EnvValue $EnvFile "MINI_APP_URL" $currentUrl
            Write-EnvValue $EnvFile "RENDER_EXTERNAL_URL" ""

            # Restart so app/webhook load the new PUBLIC_BASE_URL from .env.
            Start-Backend $Python $script:ProjectDir $Port $BackendOut $BackendErr
        } else {
            $currentUrl = $currentUrl.TrimEnd("/")
        }
    } else {
        # Backend first: Quick Tunnel needs a local upstream.
        Start-Backend $Python $script:ProjectDir $Port $BackendOut $BackendErr
        $currentUrl = Start-Tunnel $cloudflared $Port $script:ProjectDir $TunnelOut $TunnelErr

        Write-EnvValue $EnvFile "PUBLIC_BASE_URL" $currentUrl
        Write-EnvValue $EnvFile "MINI_APP_URL" $currentUrl
        Write-EnvValue $EnvFile "RENDER_EXTERNAL_URL" ""

        # Restart so app/webhook load the new PUBLIC_BASE_URL.
        Start-Backend $Python $script:ProjectDir $Port $BackendOut $BackendErr
    }

    if (-not (Wait-Http ($currentUrl + "/health") 35)) {
        throw "Public health check failed: $currentUrl/health"
    }

    Write-Section "BetTON is READY"
    $head = (& git rev-parse HEAD 2>$null | Select-Object -First 1)
    $branch = (& git branch --show-current 2>$null | Select-Object -First 1)
    Write-Host "Git branch:          $branch"
    Write-Host "Git HEAD:            $head"
    Write-Host "Mini App (legacy /): $currentUrl/"
    Write-Host "React preview /v2/:  $currentUrl/v2/"
    Write-Host "Health:              $currentUrl/health"
    $botName = Read-EnvValue $EnvFile "TELEGRAM_BOT_USERNAME"
    if ([string]::IsNullOrWhiteSpace($botName)) {
        Write-Host "TELEGRAM_BOT_USERNAME: (empty; React share uses /v2/?share= fallback)"
    } else {
        Write-Host "TELEGRAM_BOT_USERNAME: $botName"
    }
    Write-Host ""
    Write-Host "KEEP THIS WINDOW OPEN."
    Write-Host "The same trycloudflare URL is kept while cloudflared stays alive."
    Write-Host "If only uvicorn dies, it is restarted without changing the URL."
    Write-Host "If the Quick Tunnel itself dies, a new URL is created automatically."
    Write-Host "After that, users should send the bot a fresh /start."
    Write-Host ""

    $failures = 0

    while ($true) {
        Start-Sleep -Seconds 30

        $localHealth = "http://127.0.0.1:$Port/health"
        if (-not (Test-Http $localHealth 5)) {
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] backend down -> restarting"
            try {
                Start-Backend $Python $script:ProjectDir $Port $BackendOut $BackendErr
            } catch {
                Write-Host "Backend restart failed: $($_.Exception.Message)"
                continue
            }
        }

        $tunnelRunning = @(Get-Process cloudflared -ErrorAction SilentlyContinue).Count -gt 0
        $publicOk = $false
        if ($tunnelRunning) {
            $publicOk = Test-Http ($currentUrl + "/health") 7
        }

        if ($tunnelRunning -and $publicOk) {
            $failures = 0
            continue
        }

        $failures++
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] public tunnel check failed ($failures/3)"

        if ($failures -lt 3) { continue }

        try {
            Write-Host "Recreating Quick Tunnel..."
            $currentUrl = Start-Tunnel $cloudflared $Port $script:ProjectDir $TunnelOut $TunnelErr

            Write-EnvValue $EnvFile "PUBLIC_BASE_URL" $currentUrl
            Write-EnvValue $EnvFile "MINI_APP_URL" $currentUrl
            Write-EnvValue $EnvFile "RENDER_EXTERNAL_URL" ""

            Start-Backend $Python $script:ProjectDir $Port $BackendOut $BackendErr

            if (-not (Wait-Http ($currentUrl + "/health") 35)) {
                throw "New public health check failed."
            }

            Write-Host "New Mini App URL: $currentUrl"
            $failures = 0
        } catch {
            Write-Host "Tunnel recovery failed: $($_.Exception.Message)"
            $failures = 0
        }
    }
}
catch {
    Write-Host ""
    Write-Host "STARTUP ERROR" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    try {
        if ($BackendErr -and (Test-Path $BackendErr)) {
            Write-Host "Last uvicorn log lines:"
            Get-Content -LiteralPath $BackendErr -Tail 30
        }
        if ($TunnelErr -and (Test-Path $TunnelErr)) {
            Write-Host "Last cloudflared log lines:"
            Get-Content -LiteralPath $TunnelErr -Tail 30
        }
    } catch {}
    Write-Host ""
    Write-Host "The window will stay open. Send me a screenshot of this error."
    Read-Host "Press Enter to exit" | Out-Null
    exit 1
}
