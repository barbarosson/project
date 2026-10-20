# MSIX packaging — Smart Home Assistant

Windows-only. Produces a Store-oriented package with **`runFullTrust`** (WPF + local `docker` CLI).  
**Does not** elevate or install Docker Desktop.

## Prerequisites (Windows)

- Visual Studio 2022 with **Windows application packaging** / UWP workload
- .NET 8 SDK
- Optional: Partner Center signing (Store upload re-signs)

## Build Store MSIX (recommended)

From a **Developer PowerShell for VS 2022** (or VS → right-click package project → Publish → Create App Packages):

```powershell
cd HaSetup

# Ensure WPF app is built with STORE_BUILD (silent Docker install off)
dotnet build src\HaSetup.App\HaSetup.App.csproj -c Release -p:StoreBuild=true

# Packaging project (MSBuild / Visual Studio)
msbuild packaging\HaSetup.Package\HaSetup.Package.wapproj `
  /p:Configuration=Release `
  /p:Platform=x64 `
  /p:StoreBuild=true `
  /p:UapAppxPackageBuildMode=StoreUpload `
  /p:AppxPackageDir="$PWD\artifacts\msix\"
```

Output: `HaSetup\artifacts\msix\` (or VS AppPackages folder) → `.msix` / `.msixupload`.

### Visual Studio UI

1. Open `HaSetup.sln`
2. Set configuration **Release** | **x64**
3. Right-click **HaSetup.Package** → **Publish** → **Create App Packages…**
4. Choose **Microsoft Store** (or sideload for local test)
5. Confirm identity in `Package.appxmanifest` matches Partner Center reserved name **Smart Home Assistant**

## Dev / sideload (silent install allowed)

```powershell
dotnet build src\HaSetup.App\HaSetup.App.csproj -c Release
# Omit -p:StoreBuild=true  → “Sessiz kurulum dene” visible
dotnet run --project src\HaSetup.App\HaSetup.App.csproj -c Release
```

## Manifest notes

| Item | Value |
|------|--------|
| Display name | Smart Home Assistant |
| Capability | `runFullTrust` only (no `allowElevation`) |
| Docker | User installs separately (Store deep-link / download) |
| HA lifecycle | When Docker is ready: existing Core service (port 8123) |

Replace `Publisher="CN=SmartHomeAssistant"` with your Partner Center publisher CN before submission.
