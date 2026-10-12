# UplinkFtp.LicenseApi (sample)

**Not production-hosted.** Minimal ASP.NET Core (`net8.0`) reference implementation of the Web license validate contract used by `WebLicenseService`.

## Contract

```
POST /v1/licenses/validate
Content-Type: application/json

{ "licenseKey": "SAMPLE-PRO-KEY", "productId": "UplinkFtp" }

200:
{ "valid": true, "tier": "Pro", "token": "<hmac-jwt-like>", "expiresAt": "..." }
```

Matches `docs/licensing-contract.md` and `WebLicenseService` (`ValidateRequest` / `ValidateResponse`).

## Run (local)

```bash
cd samples/LicenseApi
dotnet run
# → http://localhost:5088
```

Point the WinUI Web channel at it:

```bash
export UPLINK_LICENSE_URL=http://localhost:5088
# then enter SAMPLE-PRO-KEY in the License dialog (or UPLINK_LICENSE_KEY)
```

## Environment variables

| Variable | Purpose |
| --- | --- |
| `UPLINK_LICENSE_SIGNING_KEY` | HMAC key for tokens. **Dev default** in config is `DEV-PLACEHOLDER-SIGNING-KEY-NOT-FOR-PRODUCTION` — placeholder only. |
| `UPLINK_LICENSE_SAMPLE_KEYS` | Optional seed: `SAMPLE-PRO-KEY:Pro,SAMPLE-FREE-KEY:Free` |
| `ASPNETCORE_ENVIRONMENT` | `Development` loads `appsettings.Development.json` SAMPLE keys |

## Sample keys (non-production)

Development profile seeds:

- `SAMPLE-PRO-KEY` → Pro  
- `SAMPLE-FREE-KEY` → Free  

These are **not** the client stub keys (`UPLINK-PRO` / `UPLINK-PRO-DEV`). The Production profile does **not** seed `UPLINK-PRO`. Do not treat SAMPLE keys as real entitlements.

## External blockers (hosting / credentials)

Shipping a real license backend requires work **outside this repo**:

- Hosted HTTPS endpoint + DNS / TLS certificates  
- Production signing key in a secret store (not appsettings)  
- Key issuance, revocation, and customer billing  
- Partner Center / Store association for the Store channel  

This sample intentionally ships **no secrets, no fake certs, and no deploy scripts that publish externally**.
