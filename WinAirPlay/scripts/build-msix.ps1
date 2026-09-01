#Requires -Version 5.1
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$dotnet = "dotnet"
if (-not (Get-Command $dotnet -ErrorAction SilentlyContinue)) {
    $dotnet = "C:\Program Files\dotnet\dotnet.exe"
}

Write-Host "Generating Store logo assets..."
& $dotnet run --project "tools\GenerateStoreAssets\GenerateStoreAssets.csproj" --configuration Release

$pfxPath = Join-Path $root "src\WinAirPlay.Package\WinAirPlay.Package_TemporaryKey.pfx"
if (-not (Test-Path $pfxPath)) {
    Write-Host "Creating dev signing certificate..."
    & (Join-Path $PSScriptRoot "create-msix-cert.ps1")
}

$msbuild = & "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe" `
    -latest -requires Microsoft.Component.MSBuild -find MSBuild\**\Bin\MSBuild.exe `
    -prerelease | Select-Object -First 1

if (-not $msbuild) {
    Write-Error @"
MSBuild with Desktop Bridge (MSIX) targets not found.
Install Visual Studio 2022 with the 'MSIX Packaging Tools' workload, then retry.
See docs/STORE_PUBLISHING.md
"@
}

Write-Host "Building MSIX package (Release|x64)..."
& $msbuild "src\WinAirPlay.Package\WinAirPlay.Package.wapproj" `
    /restore `
    /p:Configuration=Release `
    /p:Platform=x64 `
    /p:AppxPackageSigningEnabled=true

Write-Host ""
Write-Host "Done. Check AppPackages\ for the .msix output."
