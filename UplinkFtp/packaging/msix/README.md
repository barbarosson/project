# MSIX packaging (Store + sideload)

Scaffold only. **No certificates, Store IDs, or publisher secrets belong in this repo.**

## App manifest (source of truth)

`src/UplinkFtp.App/Package.appxmanifest`

Identity today uses **local placeholders** (`Name="UplinkFtp.Desktop"`, `Publisher="CN=UplinkFtp"`).  
**Do not overwrite that file with invented Partner Center IDs.** Association on a Windows machine replaces them with the real publisher CN and package identity.

Template for offline experiments: `Package.appxmanifest.template` (`REPLACE_ME_*` fields).

Restricted capability justifications (copy into Partner Center):  
[`docs/store/capability-justifications.md`](../../docs/store/capability-justifications.md)

## Channels

| Channel | Build | License |
| --- | --- | --- |
| **Store** | `-p:UplinkDistributionChannel=Store` or `build-store-channel.ps1` | `StoreLicenseService` + optional Pro add-on ID |
| **Web** (default unpackaged) | `-p:UplinkDistributionChannel=Web` or `build-web-channel.ps1` | `WebLicenseService` + license key |

Pro add-on Store ID (after Partner Center): set `UPLINK_STORE_PRO_ADDON_ID` in the environment or `signing.env` before building Store channel.

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

## Partner Center association (Barbaros — Windows)

1. Create / open the app in [Partner Center](https://partner.microsoft.com/).  
2. Note **Package identity name**, **Publisher CN**, **Publisher display name**.  
3. Create durable add-on **Uplink FTP Pro**; copy its Store ID.  
4. Visual Studio → Project → Package and Publish → **Associate App with the Store**.  
5. Commit only non-secret identity updates to `Package.appxmanifest` (never commit `.pfx` or `Package.StoreAssociation.xml` if it contains secrets — already gitignored).  
6. Set `UPLINK_STORE_PRO_ADDON_ID` locally for Store builds.  
7. Submit a package flight — **not automated from this repo**.

## Explicit non-goals in-repo

- No `.pfx` / fake self-signed certs committed  
- No invented Store association GUIDs as production truth  
- No automatic Store publish  
