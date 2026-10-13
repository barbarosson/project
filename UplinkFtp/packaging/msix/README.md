# MSIX packaging (Store + sideload)

**No certificates or Pro add-on secrets belong in this repo.** Public Partner Center identity is documented in [`docs/store/product-identity.md`](../../docs/store/product-identity.md).

## App manifest (source of truth)

`src/UplinkFtp.App/Package.appxmanifest`

Identity (applied from Partner Center):

| Field | Value |
| --- | --- |
| Name | `MODULUSTECH.UplinkFTP` |
| Publisher | `CN=7E7A2323-C3C3-4A9A-A4D1-832D351FC4BA` |
| PublisherDisplayName | `MODULUSTECH` |
| DisplayName | `Uplink FTP` |
| Store ID | `9MZKMN2ZH0DG` |

Template for offline experiments: `Package.appxmanifest.template`.

Restricted capability justifications (copy into Partner Center):  
[`docs/store/capability-justifications.md`](../../docs/store/capability-justifications.md)

## Channels

| Channel | Build | License |
| --- | --- | --- |
| **Store** | `-p:UplinkDistributionChannel=Store` or `build-store-channel.ps1` | `StoreLicenseService` + optional Pro add-on ID |
| **Web** (default unpackaged) | `-p:UplinkDistributionChannel=Web` or `build-web-channel.ps1` | `WebLicenseService` + license key |

Pro add-on Store ID defaults to `9MTN64PZGQCM` (`UPLINK_STORE_PRO_ADDON_ID` / `StoreCommerceOptions.DefaultProAddOnStoreId`). Override via env or local `signing.env` if Partner Center changes it.

## Produce an MSIX (Windows)

1. Install VS 2022 + Windows App SDK / WinUI workload.  
2. Copy `packaging/signing.env.example` → local `signing.env` (gitignored).  
3. Run:

```powershell
# Store channel (fail-closed without cert)
.\packaging\scripts\build-store-channel.ps1

# Web / sideload channel
.\packaging\scripts\build-web-channel.ps1
```

Or:

```powershell
.\packaging\scripts\build-msix.ps1 -Channel Store
```

The script **fails clearly** if `UPLINK_SIGNING_CERT_THUMBPRINT` (or path) is unset. It never invents certificates.

Manual publish:

```powershell
dotnet publish src\UplinkFtp.App\UplinkFtp.App.csproj `
  -c Release -p:Platform=x64 `
  -p:WindowsPackageType=Msix `
  -p:UplinkDistributionChannel=Store
# then SignTool / Partner Center Store-managed signing
```

## Partner Center (Barbaros — remaining)

App identity, app Store ID (`9MZKMN2ZH0DG`), and Pro add-on ID (`9MTN64PZGQCM`) are in `product-identity.md` / defaults.

1. On Windows, Visual Studio → Package and Publish → **Associate App with the Store** (refresh PhoneIdentity / association XML if needed).  
2. Sign / Store-sign MSIX and submit a package flight — **not automated from this repo**.  
3. Sandbox: Free → Buy Pro → limits lift.

## Explicit non-goals in-repo

- No `.pfx` / fake self-signed certs committed  
- No automatic Store publish  
