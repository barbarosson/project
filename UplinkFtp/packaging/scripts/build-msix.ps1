#Requires -Version 5.1
<#
.SYNOPSIS
  Scaffold: build a signed MSIX for Uplink FTP (Windows only).

.DESCRIPTION
  Fails clearly when signing certificate env is not set.
  Never invents or generates certificates.
  Does not publish to Partner Center / Store.
#>
[CmdletBinding()]
param(
    [string]$Configuration = "Release",
    [string]$Platform = "x64",
    [string]$Channel = "Store"
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $root

$thumb = $env:UPLINK_SIGNING_CERT_THUMBPRINT
$certPath = $env:UPLINK_SIGNING_CERT_PATH
$publisher = $env:STORE_PUBLISHER

if ([string]::IsNullOrWhiteSpace($thumb) -and [string]::IsNullOrWhiteSpace($certPath)) {
    Write-Error @"
Signing certificate not configured.

Set one of:
  UPLINK_SIGNING_CERT_THUMBPRINT  (preferred — thumbprint in CurrentUser\My)
  UPLINK_SIGNING_CERT_PATH        (path to .pfx; do not commit the file)

Optional:
  STORE_PUBLISHER                 (CN=... matching Partner Center)
  UPLINK_SIGNING_CERT_PASSWORD    (if using a password-protected .pfx — local only)

See packaging/signing.env.example. This script will not create fake certificates.
"@
    exit 1
}

if ([string]::IsNullOrWhiteSpace($publisher)) {
    Write-Warning "STORE_PUBLISHER is empty. Package Identity Publisher must match your signing cert / Partner Center CN."
}

Write-Host "Publishing UplinkFtp.App ($Configuration|$Platform, channel=$Channel)..."
dotnet publish "src\UplinkFtp.App\UplinkFtp.App.csproj" `
    -c $Configuration `
    -p:Platform=$Platform `
    -p:WindowsPackageType=MSIX `
    -p:UplinkDistributionChannel=$Channel `
    -p:EnableWindowsTargeting=true

if ($LASTEXITCODE -ne 0) {
    Write-Error "dotnet publish failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

Write-Host @"

Publish finished (or produced package artifacts under bin/ publish folders).
Next (manual):
  1. Locate the .msix / .msixbundle under the publish output.
  2. Sign with SignTool using thumbprint '$thumb' or cert at '$certPath'.
  3. Upload via Partner Center — not automated here.

"@
