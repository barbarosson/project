# Uplink FTP — Privacy policy (draft)

**Status:** Draft for product review. Not legal advice. Replace publisher contact details before public beta.

**Effective (planned):** with public beta / v1.0  
**Product:** Uplink FTP (Windows desktop client)

## Summary

Uplink FTP is a desktop FTP / FTPS / SFTP client. By default it does **not** send telemetry. Credentials and license keys are stored locally using OS-protected storage. We do not log passwords.

## Data we process on your device

| Data | Purpose | Storage |
| --- | --- | --- |
| Site host, port, username, protocol, display names | Site Manager / quick connect | Local SQLite (`EF Core`) — **passwords not stored in DB** |
| Passwords / private key material | Authenticate to remote servers you choose | Windows PasswordVault and/or DPAPI via `ICredentialStore` |
| Web license key | Entitlement check | PasswordVault / DPAPI (`web-license` resource) |
| Transfer queue state / logs | Operate transfers; optional log export | Local machine only |
| App settings (timeouts, theme, TLS trust flag, telemetry opt-in) | Preferences | Local settings (in-memory today; disk persistence planned) |

## Network activity

- Connections you initiate to FTP / FTPS / SFTP servers  
- Optional Web license validation: `POST {UPLINK_LICENSE_URL}/v1/licenses/validate` with license key + product id (`UplinkFtp`)  
- Microsoft Store entitlement APIs when built with the Store distribution channel  
- Optional future update checks against an HTTPS appcast you configure (web channel)

We do not sell personal data. There is no advertising SDK in the client.

## Telemetry (off by default)

`TelemetryService` (`UplinkFtp.Core`) is **opt-in**. Default: disabled (`TelemetryOptIn = false`).

When enabled by the user in Settings:

- May record coarse diagnostic events (e.g. feature used, exception **type** + context label)  
- Scrubs property keys/values that look like secrets (`password`, `token`, `license`, `credential`, etc.)  
- Does **not** intentionally log passwords, private keys, or license keys  

Until a production telemetry backend is chosen and documented, opted-in events only go to the local logger sink (if configured).

## Credentials and secrets

- Passwords are never written to the SQLite database  
- Application logs must not include password fields  
- Stub license keys (`UPLINK-PRO*`) are for Debug / explicit env override only — not production entitlements  

## Children’s privacy

Uplink FTP is not directed at children under 13 (or the equivalent age in your jurisdiction).

## Your choices

- Do not opt into telemetry (default)  
- Delete saved sites and clear credential vault entries from Site Manager / OS credential UI  
- Uninstall the app to remove local SQLite and settings  

## Contact

**REPLACE_ME_SUPPORT_EMAIL** — see also `docs/support.md`.

## Changes

Material changes to this policy will be noted in `docs/CHANGELOG.md` and release notes.
