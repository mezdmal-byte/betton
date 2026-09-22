$ErrorActionPreference = "Stop"

Write-Host "Installing BetTON design skills..." -ForegroundColor Cyan

npx skills@latest add emilkowalski/skills --skill "emil-design-eng" --yes
npx skills@latest add emilkowalski/skills --skill "prototype" --yes

$expected = @(
  ".agents/skills/emil-design-eng/SKILL.md",
  ".agents/skills/prototype/SKILL.md",
  ".agents/skills/prototype/PICKER.md"
)

$missing = @()
foreach ($path in $expected) {
  if (-not (Test-Path $path)) {
    $missing += $path
  }
}

if ($missing.Count -gt 0) {
  Write-Warning "Installer completed, but expected paths were not all found:"
  $missing | ForEach-Object { Write-Warning "  $_" }
  Write-Host "Check where the skills CLI installed the project-local skills before continuing." -ForegroundColor Yellow
  exit 2
}

Write-Host "Design skills installed and verified." -ForegroundColor Green
