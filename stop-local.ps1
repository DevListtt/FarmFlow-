param(
    [switch]$RemoveVolumes
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

docker compose version *> $null
if ($LASTEXITCODE -eq 0) {
    $cmd = "docker"
    $args = @("compose", "-p", "farmflowlocal", "-f", "docker/docker-compose.local.yml", "down", "--remove-orphans")
} else {
    $cmd = "docker-compose"
    $args = @("-p", "farmflowlocal", "-f", "docker/docker-compose.local.yml", "down", "--remove-orphans")
}

if ($RemoveVolumes) {
    $args += "-v"
}

& $cmd @args

Write-Host "FarmFlow local est arrete."
