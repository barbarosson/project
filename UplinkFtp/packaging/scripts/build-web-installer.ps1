#Requires -Version 5.1
<#
.SYNOPSIS
  Scaffold: build a Web-channel sideload package / installer inputs.

.DESCRIPTION
  Fails when signing env is missing. Does not invent certs or upload to a CDN.
#>
[CmdletBinding()]
param(
    [string]$Configuration = "Release",
    [string]$Platform = "x64"
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $root

$thumb = $env:UPLINK_SIGNING_CERT_THUMBPRINT
$certPath = $env:UPLINK_SIGNING_CERT_PATH

if ([string]::IsNullOrWhiteSpace($thumb) -and [string]::IsNullOrWhiteSpace($certPath)) {
    Write-Error @"
Signing certificate not configured for web/sideload package.

Set UPLINK_SIGNING_CERT_THUMBPRINT or UPLINK_SIGNING_CERT_PATH.
See packaging/signing.env.example.
This script will not create fake certificates or publish externally.
"@
    exit 1
}

Write-Host "Publishing Web-channel unpackaged / MSIX sideload inputs..."
dotnet publish "src\UplinkFtp.App\UplinkFtp.App.csproj" `
    -c $Configuration `
    -p:Platform=$Platform `
    -p:UplinkDistributionChannel=Web `
    -p:EnableWindowsTargeting=true

if ($LASTEXITCODE -ne 0) {
    Write-Error "dotnet publish failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

Write-Host @"

Publish complete.
Manual follow-ups (external):
  - Sign the package with your org cert
  - Host package + packaging/web/appcast.json (from appcast.sample.json) on HTTPS
  - Point users / bootstrapper at the appcast URL
  - Do not commit production URLs or hashes into the sample appcast

"@
