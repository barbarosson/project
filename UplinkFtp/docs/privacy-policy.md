# Uplink FTP — Privacy policy

**Status:** Publish-ready draft. Not legal advice. Complete every **FILL_IN_*** before hosting the public URL.

**Effective:** with public Store / v1.0 release  
**Product:** Uplink FTP (Windows desktop client)  
**Public URL (host this file or an HTML export):** **FILL_IN_PRIVACY_POLICY_HTTPS_URL**  
**Contact:** **FILL_IN_SUPPORT_EMAIL**

## Summary

Uplink FTP is a desktop FTP / FTPS / SFTP client. By default it does **not** send telemetry. Credentials and license keys are stored locally using OS-protected storage. We do not log passwords.

## Data we process on your device

| Data | Purpose | Storage |
| --- | --- | --- |
| Site host, port, username, protocol, display names | Site Manager / quick connect | Local SQLite (`EF Core`) — **passwords not stored in DB** |
| Passwords / private key material | Authenticate to remote servers you choose | Windows PasswordVault and/or DPAPI via `ICredentialStore` |
| Web license key (sideload / Web channel) | Entitlement check | PasswordVault / DPAPI |
| Optional AI API key (BYOK) | Cloud AI Assist you enable | Windows Credential Locker |
| Transfer queue state / logs | Operate transfers; optional log export | Local machine only |
| App settings (timeouts, theme, TLS trust flag, telemetry opt-in) | Preferences | Local settings |

## Network activity

- Connections you initiate to FTP / FTPS / SFTP servers  
- Optional Web license validation: `POST {license-host}/v1/licenses/validate` with license key + product id (`UplinkFtp`) — Web channel only  
- Microsoft Store entitlement and purchase APIs when installed from the Store  
- Optional AI provider HTTPS calls **only if** you paste an API key and use Assist  
- Optional future update checks against an HTTPS appcast you configure (Web channel)

We do not sell personal data. There is no advertising SDK in the client.

## Purchases

On the Microsoft Store build, optional **Uplink FTP Pro** is offered as a durable add-on. Payment is processed by Microsoft; this app receives entitlement status from Store APIs.

## Telemetry (off by default)

`TelemetryService` is **opt-in**. Default: disabled.

When enabled in Settings:

- May record coarse diagnostic events (feature used, exception **type** + context label)  
- Scrubs property keys/values that look like secrets (`password`, `token`, `license`, `credential`, etc.)  
- Does **not** intentionally log passwords, private keys, license keys, or AI API keys  

Until a production telemetry backend is chosen and documented here, opted-in events only go to a local logger sink (if configured).

## Credentials and secrets

- Passwords are never written to the SQLite database  
- Application logs must not include password fields  
- Stub license keys (`UPLINK-PRO*`) are for Debug / explicit env override only — not production entitlements  

## Children’s privacy

Uplink FTP is not directed at children under 13 (or the equivalent age in your jurisdiction).

## Your choices

- Do not opt into telemetry (default)  
- Delete saved sites and clear credential vault entries from Site Manager / OS credential UI  
- Clear stored AI API keys in Settings  
- Uninstall the app to remove local SQLite and settings  

## Contact

**FILL_IN_SUPPORT_EMAIL** — see also `docs/support.md`.  
Security reports: **FILL_IN_SECURITY_EMAIL**.

## Changes

Material changes to this policy will be noted in `docs/CHANGELOG.md` and release notes, and on **FILL_IN_PRIVACY_POLICY_HTTPS_URL**.
