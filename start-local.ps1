param(
    [switch]$NoBuild,
    [switch]$SkipPortCheck
)

$ErrorActionPreference = "Stop"

function Get-ComposePrefix {
    docker compose version *> $null
    if ($LASTEXITCODE -eq 0) {
        return @("docker", "compose")
    }

    docker-compose version *> $null
    if ($LASTEXITCODE -eq 0) {
        return @("docker-compose")
    }

    throw "Docker Compose est introuvable. Installe Docker Desktop, puis relance ce script."
}

function Invoke-Compose {
    param(
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$Args
    )

    if ($script:ComposePrefix.Count -eq 2) {
        & $script:ComposePrefix[0] $script:ComposePrefix[1] "-p" "farmflowlocal" "-f" $script:ComposeFile @Args
    } else {
        & $script:ComposePrefix[0] "-p" "farmflowlocal" "-f" $script:ComposeFile @Args
    }
}

function Test-HttpReady {
    param(
        [string]$Url,
        [int]$Attempts = 60
    )

    for ($i = 1; $i -le $Attempts; $i++) {
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
                return $true
            }
        } catch {
            Start-Sleep -Seconds 2
        }
    }

    return $false
}

function Show-ServiceLogs {
    param([string]$Service)
    Write-Host ""
    Write-Host "Derniers logs $Service :" -ForegroundColor Yellow
    Invoke-Compose logs --tail 120 $Service
}

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

Write-Host "Verification Docker..."
docker info *> $null
if ($LASTEXITCODE -ne 0) {
    throw "Docker Desktop ne repond pas. Ouvre Docker Desktop, attends qu'il soit pret, puis relance .\start-local.ps1"
}

if (-not $SkipPortCheck) {
    $ports = @(3000, 8000, 5432, 6379, 8086)
    foreach ($port in $ports) {
        $used = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        if ($used) {
            Write-Warning "Le port $port est deja utilise. Si le lancement echoue, libere ce port ou lance .\stop-local.ps1 avant de relancer."
        }
    }
}

if (-not (Test-Path "backend\.env")) {
    Copy-Item "backend\.env.example" "backend\.env"
}

Set-Content -Path "frontend\.env.local" -Value "NEXT_PUBLIC_API_URL=http://localhost:8000" -Encoding UTF8

$script:ComposePrefix = @(Get-ComposePrefix)
$script:ComposeFile = "docker/docker-compose.local.yml"

Write-Host "Nettoyage des anciens conteneurs FarmFlow locaux..."
Invoke-Compose down --remove-orphans

if (-not $NoBuild) {
    Write-Host "Build backend/frontend..."
    Invoke-Compose build backend frontend
}

Write-Host "Demarrage des services..."
Invoke-Compose up -d postgres redis influxdb backend frontend

Write-Host ""
Write-Host "Attente API http://localhost:8000/health ..."
if (-not (Test-HttpReady -Url "http://localhost:8000/health" -Attempts 75)) {
    Show-ServiceLogs "backend"
    throw "Le backend ne repond pas. Les logs ci-dessus indiquent la cause."
}

Write-Host "Attente frontend http://localhost:3000 ..."
if (-not (Test-HttpReady -Url "http://localhost:3000" -Attempts 75)) {
    Show-ServiceLogs "frontend"
    throw "Le frontend ne repond pas. Les logs ci-dessus indiquent la cause."
}

Write-Host ""
Write-Host "FarmFlow local est lance." -ForegroundColor Green
Write-Host "Frontend : http://localhost:3000"
Write-Host "API      : http://localhost:8000"
Write-Host "Swagger  : http://localhost:8000/docs"
Write-Host ""
Write-Host "Logs backend : docker compose -p farmflowlocal -f docker/docker-compose.local.yml logs -f backend"
Write-Host "Logs frontend: docker compose -p farmflowlocal -f docker/docker-compose.local.yml logs -f frontend"
Write-Host "Arret        : .\stop-local.ps1"
