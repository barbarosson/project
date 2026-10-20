# Experimental skeleton: host ↔ WSL2 UDP forward helper for mDNS (UDP/5353).
# Premium / Experimental in Container Manager for HA — default OFF in the UI.
#
# This script does NOT implement a production-grade forwarder yet.
# It documents ports and a safe no-op start/stop contract for the hosted service.
#
# Usage:
#   .\mdns-udp-forward.ps1 -Mode start
#   .\mdns-udp-forward.ps1 -Mode stop
#   .\mdns-udp-forward.ps1 -Mode status

[CmdletBinding()]
param(
    [ValidateSet('start', 'stop', 'status')]
    [string]$Mode = 'status',

    [int]$MdnsPort = 5353,

    [string]$StateDir = $(Join-Path $env:LOCALAPPDATA 'HaSetup\mdns-forward')
)

$ErrorActionPreference = 'Stop'

function Write-HaInfo([string]$Message) {
    Write-Output "[HaSetup mDNS skeleton] $Message"
}

function Get-StatePath {
    if (-not (Test-Path -LiteralPath $StateDir)) {
        New-Item -ItemType Directory -Path $StateDir -Force | Out-Null
    }
    return (Join-Path $StateDir 'forwarder.state')
}

switch ($Mode) {
    'start' {
        $state = Get-StatePath
        @"
enabled=1
port=$MdnsPort
note=skeleton-only; no UDP sockets bound yet
started=$(Get-Date -Format o)
"@ | Set-Content -LiteralPath $state -Encoding UTF8
        Write-HaInfo "Armed experimental forwarder state (port $MdnsPort). No packets forwarded in this skeleton."
        Write-HaInfo "Next iteration: bind UDP $MdnsPort on the Windows host and relay into the Docker Desktop WSL distro."
        exit 0
    }
    'stop' {
        $state = Get-StatePath
        if (Test-Path -LiteralPath $state) {
            Remove-Item -LiteralPath $state -Force
        }
        Write-HaInfo 'Stopped (skeleton state cleared).'
        exit 0
    }
    'status' {
        $state = Get-StatePath
        if (Test-Path -LiteralPath $state) {
            Write-HaInfo "State file present: $state"
            Get-Content -LiteralPath $state
            exit 0
        }
        Write-HaInfo 'Not running (no state file).'
        exit 0
    }
}
