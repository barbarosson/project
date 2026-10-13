#Requires -Version 5.1
<#
.SYNOPSIS
  Build the Web / sideload distribution channel (UplinkDistributionChannel=Web).

.DESCRIPTION
  Publishes unpackaged / sideload inputs. Signing still requires a real cert via env.
#>
[CmdletBinding()]
param(
    [string]$Configuration = "Release",
    [string]$Platform = "x64"
)

$ErrorActionPreference = "Stop"
& (Join-Path $PSScriptRoot "build-web-installer.ps1") -Configuration $Configuration -Platform $Platform
exit $LASTEXITCODE
