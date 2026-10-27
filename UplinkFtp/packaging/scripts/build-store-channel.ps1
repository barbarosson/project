#Requires -Version 5.1
<#
.SYNOPSIS
  Build the Store distribution channel (UplinkDistributionChannel=Store).

.DESCRIPTION
  Thin wrapper around build-msix.ps1 with Channel=Store.
  Still fail-closed on missing signing cert — does not invent certificates or Store IDs.
#>
[CmdletBinding()]
param(
    [string]$Configuration = "Release",
    [string]$Platform = "x64"
)

$ErrorActionPreference = "Stop"
& (Join-Path $PSScriptRoot "build-msix.ps1") -Configuration $Configuration -Platform $Platform -Channel Store
exit $LASTEXITCODE
