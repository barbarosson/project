# Licensing validate API contract

Contract for the Web distribution channel. Client: `UplinkFtp.Services.Licensing.WebLicenseService`. Sample server: `samples/LicenseApi/`.

## Endpoint

```
POST {ValidationBaseUrl}/v1/licenses/validate
Content-Type: application/json
```

`ValidationBaseUrl` comes from `WebLicenseOptions.ValidationBaseUrl` (env `UPLINK_LICENSE_URL`).

## Request

| Field | Type | Notes |
| --- | --- | --- |
| `licenseKey` | string | User-entered or stored key |
| `productId` | string | Always `UplinkFtp` (`WebLicenseOptions.ProductId`) |

```json
{
  "licenseKey": "SAMPLE-PRO-KEY",
  "productId": "UplinkFtp"
}
```

JSON property names are camelCase (System.Text.Json default for anonymous/`record` posts from the client).

## Response (200)

| Field | Type | Notes |
| --- | --- | --- |
| `valid` | bool | `false` → client stays Free |
| `tier` | string? | `"Pro"` or `"Free"` (case-insensitive) |
| `token` | string? | Optional JWT-like string; client may read `tier` / `plan` claims |
| `expiresAt` | string? (ISO-8601) | Optional expiry |

```json
{
  "valid": true,
  "tier": "Pro",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....",
  "expiresAt": "2026-10-13T12:00:00+00:00"
}
```

### Client parsing (`WebLicenseService`)

1. Non-success HTTP → Free  
2. `valid != true` → Free  
3. `tier` equals `Pro` (ignore case) → Pro  
4. Else best-effort JWT payload decode (no signature verify on client): claims `tier` or `plan` = `Pro` → Pro  
5. Else Free  

## Token shape (sample)

Sample `LicenseApi` issues a compact HS256 JWT-like token:

- Header: `{"alg":"HS256","typ":"JWT"}`  
- Payload: `productId`, `tier`, `plan`, `exp`, `iat`  
- Signature: HMAC-SHA256 over `header.payload` with `UPLINK_LICENSE_SIGNING_KEY`  

Production may use a full JWT library; the client only needs readable `tier`/`plan` when present.

## Offline stubs (client only)

When `AllowStubKeys` is true (Debug default; Release requires `UPLINK_ALLOW_STUB_KEYS=1`), the client accepts stub keys such as `UPLINK-PRO` / `UPLINK-PRO-DEV` without calling the API.

The **sample API Production profile must not seed those stubs**. Development sample keys use the `SAMPLE-*` prefix (e.g. `SAMPLE-PRO-KEY`).

## Store channel (freemium + durable add-on)

- Entitlement: `StoreEntitlementEvaluator` — when a Pro add-on ID is configured, **only** an active durable Pro add-on grants Pro (free app `IsActive && !IsTrial` stays Free). Without an add-on ID (legacy paid-app SKU), a non-trial active app license is Pro.
- Purchase: `StoreLicenseService.RequestPurchaseProAsync` via configured `UPLINK_STORE_PRO_ADDON_ID` (default `9MTN64PZGQCM`). License dialog **Buy Pro** shows on Store channel when tier is Free.
- Defaults match Partner Center public Store IDs; override with env when needed.
- WinUI 3 desktop: `StoreContext` is initialized with the main window HWND via `InitializeWithWindow` before license refresh and purchase (avoids `COMException` on `RequestPurchaseAsync`).

### Manual Store sandbox check (after a Store-channel rebuild)

1. Install the Store-signed / flight package (not an unpackaged sideload Web build).  
2. Sign in with a **sandbox / test** Microsoft account that can buy the Pro add-on.  
3. **License** → Tier **Free**, **Buy Pro** visible → complete purchase for add-on `9MTN64PZGQCM`.  
4. Confirm Tier **Pro**, Buy Pro hidden, Free limits lift. If purchase fails, the dialog should show the real exception type **and** message (not only `COMException`).

## External blockers

- Hosted HTTPS deployment and TLS (Web license API)  
- Production signing key management  
- Key issuance / revocation / billing (Web)  
- Partner Center association + real Store add-on ID  

See `samples/LicenseApi/README.md` and `docs/store/`.
