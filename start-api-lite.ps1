param(
    [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Backend = Join-Path $Root "backend"
$Venv = Join-Path $Root ".venv-lite"

function Get-PythonCommand {
    py -3 --version *> $null
    if ($LASTEXITCODE -eq 0) {
        return @("py", "-3")
    }

    python --version *> $null
    if ($LASTEXITCODE -eq 0) {
        return @("python")
    }

    throw "Python 3 est introuvable. Installe Python 3.11 ou 3.12, puis relance ce script."
}

function Invoke-Python {
    param(
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$Args
    )

    $extraArgs = @()
    if ($script:PythonCommand.Count -gt 1) {
        $extraArgs = $script:PythonCommand[1..($script:PythonCommand.Count - 1)]
    }

    & $script:PythonCommand[0] @extraArgs @Args
}

$script:PythonCommand = @(Get-PythonCommand)

if (-not (Test-Path $Venv)) {
    Write-Host "Creation de l'environnement Python local..."
    Invoke-Python -m venv $Venv
}

$PythonExe = Join-Path $Venv "Scripts\python.exe"

if (-not $SkipInstall) {
    Write-Host "Installation des dependances API legeres..."
    & $PythonExe -m pip install --upgrade pip
    & $PythonExe -m pip install fastapi==0.109.0 uvicorn==0.27.0 pydantic==2.5.3 python-multipart==0.0.6
}

Set-Location $Backend
Write-Host ""
Write-Host "API legere FarmFlow : http://localhost:8000"
Write-Host "Swagger            : http://localhost:8000/docs"
Write-Host "Arret              : Ctrl+C"
& $PythonExe -m uvicorn app.local_pilotage_main:app --reload --host 0.0.0.0 --port 8000
