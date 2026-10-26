param([switch]$Install)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$pythonPath = Join-Path $projectRoot '.venv/Scripts/python.exe'
if (-not (Test-Path -LiteralPath $pythonPath)) { throw 'Project .venv is required. No runtime is installed by this script.' }
$codexRoot = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $env:USERPROFILE '.codex' }
$installerPath = Join-Path $codexRoot 'skills/.system/skill-installer/scripts/install-skill-from-github.py'
$sources = @(
    @{Name='apple-design'; Repo='emilkowalski/skills'; Ref='2d228630ba1446365f614a108cb8252f1feda202'; Path='skills/apple-design'},
    @{Name='find-skills'; Repo='vercel-labs/skills'; Ref='a80e4c9d12d607631249d4d7d059f835d4b2f13a'; Path='skills/find-skills'},
    @{Name='ui-ux-pro-max'; Repo='nextlevelbuilder/ui-ux-pro-max-skill'; Ref='d14efff8ed1faa4187f004f79926f428c8074ec7'; Path='.claude/skills/ui-ux-pro-max'}
)
foreach ($source in $sources) {
    $destination = Join-Path $projectRoot ('.agents/skills/' + $source.Name)
    if (Test-Path -LiteralPath $destination) { continue }
    if (-not $Install) { throw ('Missing pinned skill: ' + $source.Name + '. Use -Install to download it.') }
    if (-not (Test-Path -LiteralPath $installerPath)) { throw 'Bundled skill-installer is unavailable.' }
    & $pythonPath $installerPath --repo $source.Repo --ref $source.Ref --path $source.Path --dest (Join-Path $projectRoot '.agents/skills')
    if ($LASTEXITCODE -ne 0) { throw ('Pinned installation failed: ' + $source.Name) }
    $licenseUrl = 'https://raw.githubusercontent.com/' + $source.Repo + '/' + $source.Ref + '/LICENSE'
    $license = (Invoke-WebRequest -Uri $licenseUrl).Content
    [IO.File]::WriteAllText((Join-Path $destination 'LICENSE'), $license, [Text.UTF8Encoding]::new($false))
    if ($source.Name -eq 'ui-ux-pro-max') {
        # Upstream has spaces on otherwise blank lines; preserve the repository's diff gate.
        $scriptPath = Join-Path $destination 'scripts/design_system.py'
        $body = [IO.File]::ReadAllText($scriptPath) -replace '(?m)^[\t ]+(?=\r?$)', ''
        [IO.File]::WriteAllText($scriptPath, $body, [Text.UTF8Encoding]::new($false))
    }
}
& $pythonPath (Join-Path $projectRoot 'scripts/check_dev.py') --skills
if ($LASTEXITCODE -ne 0) { throw 'Project skill file/hash validation failed. Existing files were not overwritten.' }
Write-Host 'Pinned skill files validated. This does not prove discovery or invocation in the current Codex session.'
