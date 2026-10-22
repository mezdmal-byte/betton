# BetTON safe source updater, Windows PowerShell 5.1+
# Does NOT edit *.bat, *.cmd, *.ps1, .env*, local databases, .git or local build/runtime dirs.
# Syncs branch feature/react-full-preview into the existing project; backups before overwrite.
$ErrorActionPreference = 'Stop'
$ProjectDir = 'C:\Users\1\betton'
$TargetBranch = 'feature/react-full-preview'
$ExpectedRepo = 'mezdmal-byte/betton'
$Stage = Join-Path ([System.IO.Path]::GetTempPath()) ('betton-update-' + [guid]::NewGuid().ToString('N'))
$BackupDir = $null
$Succeeded = $false

function Is-Protected([string]$Relative) {
    $normalized = $Relative.Replace('\', '/').TrimStart('/')
    $parts = $normalized.Split('/')
    foreach ($part in $parts) {
        if ($part -in @('.git', '.venv', 'venv', 'node_modules', '.betton-run',
                        '.betton-update-backups', '__pycache__', '.pytest_cache',
                        '.mypy_cache', '.next', 'dist', 'build', '.cache')) {
            return $true
        }
    }
    $name = [System.IO.Path]::GetFileName($normalized)
    $ext = [System.IO.Path]::GetExtension($name).ToLowerInvariant()
    if ($ext -in @('.bat', '.cmd', '.ps1', '.db', '.sqlite', '.sqlite3',
                    '.log', '.pem', '.key', '.pid')) { return $true }
    if ($name -match '(?i)^\.env($|\.)') { return $true }
    if ($name -match '(?i)\.(db|sqlite|sqlite3)-(wal|shm|journal)$') { return $true }
    if ($name -match '(?i)^\.python-version$') { return $true }
    return $false
}

function Save-Previous([string]$Path, [string]$Relative) {
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return }
    $target = Join-Path (Join-Path $BackupDir 'previous') $Relative
    $parent = Split-Path -Parent $target
    New-Item -ItemType Directory -Path $parent -Force | Out-Null
    Copy-Item -LiteralPath $Path -Destination $target -Force -ErrorAction Stop
}

try {
    Write-Host ''
    Write-Host '========== BetTON SAFE UPDATE ==========' -ForegroundColor Cyan
    Write-Host "Project: $ProjectDir"
    Write-Host "Source branch: $TargetBranch"
    Write-Host ''

    if (-not (Test-Path -LiteralPath $ProjectDir -PathType Container)) {
        throw "Project directory not found: $ProjectDir"
    }
    if (-not (Test-Path -LiteralPath (Join-Path $ProjectDir '.git'))) {
        throw 'Git metadata is missing. This updater requires the existing BetTON Git checkout.'
    }
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        throw 'Git is not installed or is not in PATH.'
    }
    $remote = [string]((& git -C $ProjectDir remote get-url origin | Select-Object -First 1))
    if ($LASTEXITCODE -ne 0) { throw 'Cannot read Git origin.' }
    $remote = $remote.Trim()
    if ($remote -notmatch '^(https://github[.]com/|git@github[.]com:|ssh://git@github[.]com/|https://[^/]+@github[.]com/)(mezdmal-byte/betton)([.]git)?/?$') {
        throw "Unexpected Git origin: $remote. No changes made."
    }
    $currentBranch = [string]((& git -C $ProjectDir branch --show-current | Select-Object -First 1))
    if ($LASTEXITCODE -ne 0) { throw 'Cannot read local branch.' }
    $currentBranch = $currentBranch.Trim()
    if ($currentBranch -ne $TargetBranch) {
        throw "Local branch '$currentBranch' differs from '$TargetBranch'. No changes made. The existing launcher expects '$TargetBranch'."
    }

    # Never replace program files while the old BetTON is running.
    $listeners = @(Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue)
    if ($listeners.Count -gt 0) {
        throw 'Port 8000 is in use. Stop BetTON (stop-betton-always-on.bat) before updating.'
    }
    $pidFile = Join-Path $ProjectDir '.betton-run\watchdog.pid'
    if (Test-Path -LiteralPath $pidFile) {
        $value = [string]((Get-Content -LiteralPath $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1))
        $num = 0
        if ([int]::TryParse($value, [ref]$num)) {
            if (Get-Process -Id $num -ErrorAction SilentlyContinue) {
                throw 'BetTON watchdog is still running. Stop the launcher first.'
            }
        }
    }

    Write-Host 'Downloading a clean snapshot from GitHub...' -ForegroundColor Cyan
    & git clone --quiet --depth 1 --single-branch --branch $TargetBranch $remote $Stage
    if ($LASTEXITCODE -ne 0) { throw 'Git clone failed. Existing project has NOT been changed.' }

    if (-not (Test-Path (Join-Path $Stage 'app\main.py')) -or
        -not (Test-Path (Join-Path $Stage 'frontend\package.json'))) {
        throw 'Downloaded branch lacks expected BetTON application files.'
    }

    $incoming = @{}
    foreach ($file in Get-ChildItem -LiteralPath $Stage -Recurse -Force -File) {
        $rel = $file.FullName.Substring($Stage.Length).TrimStart([char[]]@('\', '/'))
        if (Is-Protected $rel) { continue }
        $incoming[$rel.Replace('\', '/')] = $file.FullName
    }
    if ($incoming.Count -lt 20) {
        throw 'Downloaded snapshot contains suspiciously few source files.'
    }

    # Remove obsolete files ONLY if tracked by current Git and removed upstream.
    # Never delete untracked files, local launcher scripts or data files.
    $tracked = @(& git -C $ProjectDir -c core.quotepath=false ls-files)
    if ($LASTEXITCODE -ne 0) { throw 'Cannot list tracked files. No changes made.' }
    $removePlan = New-Object System.Collections.ArrayList
    foreach ($entry in $tracked) {
        $rel = ([string]$entry).Replace('\', '/').Trim()
        if (-not $rel -or (Is-Protected $rel) -or $incoming.ContainsKey($rel)) { continue }
        $dest = Join-Path $ProjectDir $rel
        if (Test-Path -LiteralPath $dest -PathType Leaf) {
            [void]$removePlan.Add([pscustomobject]@{ Relative=$rel; Destination=$dest })
        }
    }

    $copyPlan = New-Object System.Collections.ArrayList
    foreach ($rel in $incoming.Keys) {
        $source = $incoming[$rel]
        $dest = Join-Path $ProjectDir $rel
        $same = $false
        if (Test-Path -LiteralPath $dest -PathType Leaf) {
            $s = Get-Item -LiteralPath $source
            $d = Get-Item -LiteralPath $dest
            if ($s.Length -eq $d.Length) {
                $same = ((Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash -eq
                         (Get-FileHash -LiteralPath $dest -Algorithm SHA256).Hash)
            }
        }
        if (-not $same) {
            [void]$copyPlan.Add([pscustomobject]@{ Relative=$rel; Source=$source; Destination=$dest })
        }
    }

    $stamp = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'
    $BackupDir = Join-Path (Join-Path $ProjectDir '.betton-update-backups') $stamp
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    Write-Host "Backup directory: $BackupDir"
    Write-Host "Files to update/create: $($copyPlan.Count); tracked obsolete files to remove: $($removePlan.Count)"
    Write-Host 'Backing up existing files before changing anything...' -ForegroundColor Cyan

    foreach ($item in $copyPlan) { Save-Previous $item.Destination $item.Relative }
    foreach ($item in $removePlan) { Save-Previous $item.Destination $item.Relative }
    # Additionally save the important launcher + configuration files for recovery.
    foreach ($f in Get-ChildItem -LiteralPath $ProjectDir -File -Force) {
        if (Is-Protected $f.Name) { Save-Previous $f.FullName $f.Name }
    }

    Write-Host 'Copying new application source (protected files are skipped)...' -ForegroundColor Cyan
    foreach ($item in $copyPlan) {
        $parent = Split-Path -Parent $item.Destination
        if (-not (Test-Path -LiteralPath $parent)) {
            New-Item -ItemType Directory -Path $parent -Force | Out-Null
        }
        Copy-Item -LiteralPath $item.Source -Destination $item.Destination -Force -ErrorAction Stop
    }
    foreach ($item in $removePlan) {
        Remove-Item -LiteralPath $item.Destination -Force -ErrorAction Stop
    }

    $commit = [string]((& git -C $Stage rev-parse HEAD | Select-Object -First 1))
    if ($LASTEXITCODE -ne 0) { throw 'Cannot read downloaded commit.' }
    $info = @(
        "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
        "GitHub repository: $ExpectedRepo",
        "Source branch: $TargetBranch",
        "Downloaded commit: $commit",
        "Updated/created files: $($copyPlan.Count)",
        "Removed obsolete tracked source files: $($removePlan.Count)",
        "Launcher BAT/CMD/PS1, local env/database, Git metadata and runtime directories preserved.",
        "NOTE: This is a file sync, not a Git checkout. Local Git HEAD is intentionally unchanged.",
        "A launcher may report 'local changes found; git pull skipped'. Use this updater for future updates."
    )
    $info | Set-Content -LiteralPath (Join-Path $BackupDir 'UPDATE-REPORT.txt') -Encoding UTF8
    Write-Host ''
    Write-Host 'SUCCESS: BetTON source updated.' -ForegroundColor Green
    Write-Host "GitHub commit: $commit"
    Write-Host "Backup: $BackupDir"
    Write-Host 'BAT/PS1 files were NOT overwritten.'
    Write-Host 'Your original .env and local databases were NOT overwritten.'
    Write-Host 'Now launch start-betton-always-on.bat.'
    Write-Host 'WARNING: existing launcher may still do its own Git pull on clean trees.'
    $Succeeded = $true
}
catch {
    Write-Host ''
    Write-Host ("ERROR: " + $_.Exception.Message) -ForegroundColor Red
    if ($BackupDir) {
        Write-Host "Recovery copies (files existing before update): $BackupDir"
    }
    Write-Host 'If an error occurred during file copy, do NOT launch until files are checked.'
}
finally {
    if (Test-Path -LiteralPath $Stage) {
        Remove-Item -LiteralPath $Stage -Recurse -Force -ErrorAction SilentlyContinue
    }
}
if (-not $Succeeded) { exit 1 }
exit 0
