param(
  [string]$DistPath = "dist\hostinger",
  [string]$ReleasePath = "release",
  [string]$PackageName = "fluxolab-hostinger.zip",
  [string]$ServerPath = "public_html/fluxolab/"
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$dist = Join-Path $root $DistPath
$release = Join-Path $root $ReleasePath
$package = Join-Path $release $PackageName

if (-not (Test-Path $dist)) {
  throw "Pasta de build nao encontrada: $dist. Rode o build estatico antes de empacotar."
}

New-Item -ItemType Directory -Force -Path $release | Out-Null

if (Test-Path $package) {
  Remove-Item -LiteralPath $package -Force
}

Compress-Archive -Path (Join-Path $dist "*") -DestinationPath $package -Force

Write-Host "Pacote gerado: $package"
Write-Host "Envie o conteudo do ZIP para $ServerPath."
