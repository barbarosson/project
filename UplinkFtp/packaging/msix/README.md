# MSIX packaging (Store + sideload)

Scaffold only. **No certificates, Store IDs, or publisher secrets belong in this repo.**

## App manifest (source of truth)

The WinUI app already has:

`src/UplinkFtp.App/Package.appxmanifest`

Identity today uses local placeholders (`Name="UplinkFtp.Desktop"`, `Publisher="CN=UplinkFtp"`). **Do not overwrite that file with fake Partner Center IDs.** When associating with Microsoft Store / Partner Center, update identity via Visual Studio’s **Publish → Associate App with the Store** (or replace placeholders deliberately with the real Publisher CN and package identity from Partner Center).

A packaging-only template (for docs / offline packaging experiments) lives beside this README:

`Package.appxmanifest.template` — all identity fields marked `REPLACE_ME`.

## Produce an MSIX (Windows)

1. Install VS 2022 + Windows App SDK / WinUI workload.  
2. Copy `packaging/signing.env.example` → a **local** `signing.env` (gitignored) and fill thumbprint / publisher.  
3. Run (from repo root on Windows):

```powershell
.\packaging\scripts\build-msix.ps1
```

The script **fails clearly** if `UPLINK_SIGNING_CERT_THUMBPRINT` (or path) is unset. It never invents certificates.

Typical manual flow without the script:

```powershell
dotnet publish src\UplinkFtp.App\UplinkFtp.App.csproj `
  -c Release -p:Platform=x64 `
  -p:WindowsPackageType=Msix `
  -p:UplinkDistributionChannel=Store
# then sign with your org’s cert via SignTool / Partner Center
```

## Partner Center association (human steps)

1. Create / open the app in [Partner Center](https://partner.microsoft.com/).  
2. Note **Package identity name**, **Publisher**, and **Publisher display name**.  
3. In Visual Studio: Project → Package and Publish → Associate App with the Store.  
4. Replace local placeholder Identity / PublisherDisplayName to match Partner Center.  
5. Submit a package flight for certification — **not automated from this repo**.

## Explicit non-goals in-repo

- No `.pfx` / fake self-signed certs committed  
- No Store association GUIDs or secrets  
- No automatic Store publish  
