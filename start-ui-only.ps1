param(
    [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Frontend = Join-Path $Root "frontend"

node --version *> $null
if ($LASTEXITCODE -ne 0) {
    throw "Node.js est introuvable. Installe Node.js 20 LTS, puis relance ce script."
}

Set-Content -Path (Join-Path $Frontend ".env.local") -Value "NEXT_PUBLIC_API_URL=http://localhost:8000" -Encoding UTF8
Set-Location $Frontend

if (-not $SkipInstall) {
    Write-Host "Installation des dependances frontend..."
    npm install
}

Write-Host ""
Write-Host "Frontend FarmFlow : http://localhost:3000"
Write-Host "Arret             : Ctrl+C"
npm run dev
