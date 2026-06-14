param(
    [switch]$Start,
    [switch]$NoBuild,
    [switch]$SkipPortCheck
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host "== $Title ==" -ForegroundColor Cyan
}

function Require-Command {
    param(
        [string]$Name,
        [string]$InstallHint
    )

    $command = Get-Command $Name -ErrorAction SilentlyContinue
    if (-not $command) {
        throw "$Name est introuvable. $InstallHint"
    }

    return $command
}

Write-Section "Dossier"
Write-Host "FarmFlow : $Root"

Write-Section "Scripts PowerShell"
Get-ChildItem -Path $Root -Recurse -Filter "*.ps1" | Unblock-File -ErrorAction SilentlyContinue
Write-Host "Scripts debloques pour cette copie locale."

Write-Section "Git"
$git = Get-Command git -ErrorAction SilentlyContinue
if ($git) {
    & $git.Source --version
} else {
    Write-Warning "Git n'est pas dans le PATH. Installe Git for Windows ou rouvre PowerShell apres installation."
}

Write-Section "Docker"
Require-Command "docker" "Installe Docker Desktop, puis relance ce script." | Out-Null
docker --version
docker compose version
if ($LASTEXITCODE -ne 0) {
    throw "Docker Compose est introuvable. Mets Docker Desktop a jour, puis relance ce script."
}

docker info *> $null
if ($LASTEXITCODE -ne 0) {
    throw "Docker Desktop ne repond pas. Ouvre Docker Desktop, attends qu'il soit pret, puis relance ce script."
}
Write-Host "Docker Desktop repond."

Write-Section "Fichiers d'environnement"
if (-not (Test-Path "backend\.env")) {
    if (-not (Test-Path "backend\.env.example")) {
        throw "backend\.env.example est introuvable."
    }
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "Cree : backend\.env"
} else {
    Write-Host "Existe deja : backend\.env"
}

Set-Content -Path "frontend\.env.local" -Value "NEXT_PUBLIC_API_URL=http://localhost:8000" -Encoding UTF8
Write-Host "Pret : frontend\.env.local"

if (-not $SkipPortCheck) {
    Write-Section "Ports locaux"
    foreach ($port in @(3000, 8000, 5432, 6379, 8086)) {
        $used = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        if ($used) {
            Write-Warning "Port $port deja utilise. Si le lancement echoue, lance .\stop-local.cmd avant de relancer."
        } else {
            Write-Host "Port $port libre"
        }
    }
}

Write-Section "Pret"
Write-Host "Lancement Docker complet : .\start-local.cmd"
Write-Host "Diagnostic              : .\diagnose-farmflow-windows.ps1"
Write-Host "Arret                   : .\stop-local.cmd"
Write-Host ""
Write-Host "URLs apres lancement :"
Write-Host "Frontend : http://localhost:3000"
Write-Host "API      : http://localhost:8000"
Write-Host "Swagger  : http://localhost:8000/docs"

if ($Start) {
    $startArgs = @()
    if ($NoBuild) {
        $startArgs += "-NoBuild"
    }
    if ($SkipPortCheck) {
        $startArgs += "-SkipPortCheck"
    }

    & (Join-Path $Root "start-local.ps1") @startArgs
}
