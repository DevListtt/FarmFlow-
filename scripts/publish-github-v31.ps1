param(
    [string]$RepositoryUrl = "https://github.com/DevListtt/FarmFlow-.git",
    [string]$Branch = "codex/farmflow-v31-consolidation",
    [string]$WorkRoot = "$env:TEMP\farmflow-github-publish",
    [switch]$Force
)

$ErrorActionPreference = "Stop"

$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$SourceRoot = Split-Path -Parent $ScriptRoot
$CloneRoot = Join-Path $WorkRoot "FarmFlow-"
$CloneUrl = $RepositoryUrl

if ($env:GITHUB_TOKEN -and $RepositoryUrl -match '^https://github\.com/') {
    $CloneUrl = $RepositoryUrl -replace '^https://github\.com/', "https://x-access-token:$($env:GITHUB_TOKEN)@github.com/"
}

function Assert-ChildPath {
    param(
        [string]$Child,
        [string]$Parent
    )
    $resolvedChild = [System.IO.Path]::GetFullPath($Child)
    $resolvedParent = [System.IO.Path]::GetFullPath($Parent)
    if (-not $resolvedChild.StartsWith($resolvedParent, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Chemin refuse hors dossier de travail: $resolvedChild"
    }
}

git --version *> $null
if ($LASTEXITCODE -ne 0) {
    throw "Git est introuvable. Installe Git ou GitHub Desktop, puis relance ce script."
}

if ((Test-Path $WorkRoot) -and $Force) {
    Assert-ChildPath -Child $WorkRoot -Parent $env:TEMP
    Remove-Item -LiteralPath $WorkRoot -Recurse -Force
}

if (Test-Path $CloneRoot) {
    throw "Le dossier $CloneRoot existe deja. Relance avec -Force pour le remplacer."
}

New-Item -ItemType Directory -Path $WorkRoot -Force | Out-Null

Write-Host "Clone du depot GitHub..."
git clone $CloneUrl $CloneRoot
Set-Location $CloneRoot

Write-Host "Creation de la branche $Branch..."
git checkout -B $Branch origin/main

Write-Host "Copie de la version locale v31..."
robocopy $SourceRoot $CloneRoot /MIR /XD ".git" "frontend\node_modules" "frontend\.next" "frontend\out" "__pycache__" /XF "*.pyc" "*.zip" | Out-Host
if ($LASTEXITCODE -ge 8) {
    throw "Robocopy a echoue avec le code $LASTEXITCODE."
}

git status --short
git add -A

$changes = git status --short
if (-not $changes) {
    Write-Host "Aucun changement a publier."
    exit 0
}

git commit -m "Consolidate FarmFlow v31 ERP workspace"
git push -u origin $Branch

Write-Host ""
Write-Host "Branche publiee: $Branch"
Write-Host "Ouvre ensuite une PR vers main depuis GitHub."
