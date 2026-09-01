#Requires -Version 5.1
# Creates a self-signed certificate for local MSIX sideload testing.
# Store submission uses Partner Center association instead.

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$pfxPath = Join-Path $root "src\WinAirPlay.Package\WinAirPlay.Package_TemporaryKey.pfx"

if (Test-Path $pfxPath) {
    Write-Host "Certificate already exists: $pfxPath"
    exit 0
}

$cert = New-SelfSignedCertificate `
    -Type Custom `
    -Subject "CN=WinAirPlay Dev" `
    -KeyUsage DigitalSignature `
    -FriendlyName "WinAirPlay MSIX Dev" `
    -CertStoreLocation "Cert:\CurrentUser\My" `
    -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.3", "2.5.29.19={text}")

$password = ConvertTo-SecureString -String "WinAirPlay-Dev" -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $password | Out-Null

Write-Host "Created $pfxPath (password: WinAirPlay-Dev)"
Write-Host "Trust for sideload: Import the cert to Trusted People (Current User) if Windows blocks install."
