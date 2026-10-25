param([switch]$Install)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot
$python = Join-Path $projectRoot '.venv/Scripts/python.exe'
if (-not (Test-Path -LiteralPath $python)) { throw 'Project .venv is required; no dependencies were installed.' }

# Copies reviewed MIT skill folders; never runs an upstream install script.
$revision = '2d228630ba1446365f614a108cb8252f1feda202'
$codexRoot = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $env:USERPROFILE '.codex' }
$installer = Join-Path $codexRoot 'skills/.system/skill-installer/scripts/install-skill-from-github.py'
foreach ($skillName in @('emil-design-eng', 'prototype')) {
    $destination = Join-Path $projectRoot ".agents/skills/$skillName"
    if (-not (Test-Path -LiteralPath (Join-Path $destination 'SKILL.md'))) {
        if (-not $Install) { throw "Missing $skillName. Run with -Install for the reviewed pinned download." }
        if (-not (Test-Path -LiteralPath $installer)) { throw 'Bundled Codex skill-installer is unavailable.' }
        & $python $installer --repo emilkowalski/skills --ref $revision --path "skills/$skillName" --dest (Join-Path $projectRoot '.agents/skills')
        if ($LASTEXITCODE -ne 0) { throw "Pinned installation failed for $skillName" }
        $license = (Invoke-WebRequest -Uri "https://raw.githubusercontent.com/emilkowalski/skills/$revision/LICENSE").Content
        [IO.File]::WriteAllText((Join-Path $destination 'LICENSE'), $license, [Text.UTF8Encoding]::new($false))
        if ($skillName -eq 'prototype') {
            $entry = Join-Path $destination 'SKILL.md'
            $body = [IO.File]::ReadAllText($entry) -replace '(?m)^disable-model-invocation: true\r?\n', ''
            [IO.File]::WriteAllText($entry, $body, [Text.UTF8Encoding]::new($false))
            New-Item -ItemType Directory -Path (Join-Path $destination 'agents') -Force | Out-Null
            [IO.File]::WriteAllText((Join-Path $destination 'agents/openai.yaml'), "policy:`n  allow_implicit_invocation: false`n", [Text.UTF8Encoding]::new($false))
        }
    }
}
& $python scripts/check_dev.py --skills
if ($LASTEXITCODE -ne 0) { throw 'Skill verification failed; existing installation was not overwritten.' }
Write-Host 'Pinned project skills verified. New skills are discoverable on the next Codex turn.'
