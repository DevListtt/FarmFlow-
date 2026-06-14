param(
    [switch]$WithLogs
)

$ErrorActionPreference = "Continue"

function Section($Title) {
    Write-Host ""
    Write-Host "== $Title ==" -ForegroundColor Cyan
}

function Run($Label, $Command, $Arguments = @()) {
    Write-Host ""
    Write-Host "> $Label" -ForegroundColor Yellow
    try {
        & $Command @Arguments
        if ($LASTEXITCODE -ne $null -and $LASTEXITCODE -ne 0) {
            Write-Host "Exit code: $LASTEXITCODE" -ForegroundColor Red
        }
    } catch {
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}

Section "Systeme"
Write-Host "Windows architecture : $([System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture)"
Write-Host "Process architecture : $([System.Runtime.InteropServices.RuntimeInformation]::ProcessArchitecture)"
Write-Host "PowerShell           : $($PSVersionTable.PSVersion)"
Write-Host "Dossier courant      : $(Get-Location)"

Section "WSL"
Run "wsl --status" "wsl" @("--status")
Run "wsl -l -v" "wsl" @("-l", "-v")

Section "Docker"
Run "docker --version" "docker" @("--version")
Run "docker compose version" "docker" @("compose", "version")
Run "docker info" "docker" @("info")

Section "Docker Desktop"
$dockerDesktop = Get-Process "Docker Desktop" -ErrorAction SilentlyContinue
if ($dockerDesktop) {
    Write-Host "Docker Desktop process : OK"
} else {
    Write-Host "Docker Desktop process : introuvable ou pas lance" -ForegroundColor Red
}

Section "Package FarmFlow"
$hasStart = Test-Path ".\start-local.ps1"
$hasCompose = Test-Path ".\docker\docker-compose.local.yml"
Write-Host "start-local.ps1              : $hasStart"
Write-Host "docker/docker-compose.local.yml : $hasCompose"
if (-not $hasStart -or -not $hasCompose) {
    Write-Host "Lance ce script depuis le dossier FarmFlow extrait, pas depuis le ZIP ni depuis un autre dossier." -ForegroundColor Yellow
}

Section "Ports"
foreach ($port in @(3000, 8000, 5432, 6379, 8086)) {
    $used = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($used) {
        Write-Host "Port $port : utilise" -ForegroundColor Yellow
        $used | Select-Object LocalAddress, LocalPort, OwningProcess | Format-Table
    } else {
        Write-Host "Port $port : libre"
    }
}

Section "Conteneurs FarmFlow"
Run "docker ps -a --filter name=farmflow" "docker" @("ps", "-a", "--filter", "name=farmflow")

if ($hasCompose) {
    Section "Docker Compose FarmFlow"
    Run "docker compose ps" "docker" @("compose", "-p", "farmflowlocal", "-f", "docker/docker-compose.local.yml", "ps")

    if ($WithLogs) {
        Section "Logs backend"
        Run "backend logs" "docker" @("compose", "-p", "farmflowlocal", "-f", "docker/docker-compose.local.yml", "logs", "--tail", "120", "backend")

        Section "Logs frontend"
        Run "frontend logs" "docker" @("compose", "-p", "farmflowlocal", "-f", "docker/docker-compose.local.yml", "logs", "--tail", "120", "frontend")
    }
}

Section "Commandes de relance"
Write-Host "Depuis le dossier FarmFlow extrait :"
Write-Host "Set-ExecutionPolicy -Scope Process Bypass"
Write-Host "Get-ChildItem -Recurse -Filter *.ps1 | Unblock-File"
Write-Host ".\stop-local.ps1 -RemoveVolumes"
Write-Host ".\start-local.ps1"
Write-Host ""
Write-Host "Si Docker bloque encore, mode sans Docker :"
Write-Host ".\start-api-lite.ps1"
Write-Host ".\start-ui-only.ps1"
