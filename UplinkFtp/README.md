# Uplink FTP

Modern FileZilla alternative for Windows — WinUI 3 / Windows App SDK **2.5.1**, MVVM, FluentFTP, SSH.NET, EF Core + SQLite.

## Status

ADIM 1–6 client skeleton is in place. Post–ADIM work (P1–P11) adds **Core** extraction, tests, CI, protocol/resume/pool foundations, Site Manager / Settings / License UX, and **scaffolds** for license API, packaging, privacy/security, load tests, and release docs.

| Layer | Location |
| --- | --- |
| WinUI app | `src/UplinkFtp.App/` |
| Shared Core | `src/UplinkFtp.Core/` |
| Unit / load tests | `tests/UplinkFtp.Core.Tests/` |
| License API sample | `samples/LicenseApi/` (not production-hosted) |
| Packaging docs/scripts | `packaging/` |
| Product docs | `docs/` |

CI: `.github/workflows/uplink-ftp-ci.yml` (Linux Core tests + Windows WinUI build).

**UI:** Sectioned shell (connect, message log, local/remote browsers, transfer queue) with Light / Dark / System theme (**Settings → Theme**). Warm-tech teal accent, Sora UI font, JetBrains Mono for the log. Toolbar **Assist** = five-capability AI hub (troubleshoot, NL search, batch rename/move, SSH propose/approve, Quick Edit). App icon: `Assets/UplinkFtp.ico` / `UplinkLogo.png`.

**AI module:** Implemented checklist in [`docs/ai-module-checklist.md`](docs/ai-module-checklist.md); Cursor rule `.cursor/rules/uplink-ftp-ai-module.mdc`. Local heuristics without a key; optional BYOK cloud via **Settings → AI**. No embedded API keys.

### Free vs Pro (enforced in Core)

| Capability | Free | Pro |
| --- | --- | --- |
| Saved sites | 3 | Unlimited |
| Concurrent connections | 1 | Unlimited |
| Concurrent transfers | 1 | Unlimited |

### Still user-owned / external

- **P0 Windows smoke** (build, run, connect, DnD, Free gates on a real Windows box)  
- Code signing certificates, Partner Center / Store publish  
- Production license backend hosting and credentials  

## Requirements (Windows)

- Windows 10 version 1809+ / Windows 11  
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)  
- Visual Studio 2022 with **Windows App SDK / WinUI** workload (for IDE builds)  

**Runtime:** Unpackaged Debug/Release builds set `WindowsAppSDKSelfContained=true`, so the Windows App SDK framework files are copied next to the app. **Do not install Windows App Runtime 1.6** (EOL). A separate framework-dependent Runtime install is not required for the default local build.

NuGet (verified stable, non-preview): `Microsoft.WindowsAppSDK` **2.5.1**.

## Build & run (on Windows)

Always use **x64** (matches default `Platform` and output under `bin\x64\…`):

```powershell
cd UplinkFtp
git checkout cursor/ftp-ai-adim1-skeleton-e45f   # if cloning the monorepo
dotnet restore UplinkFtp.sln
dotnet build src\UplinkFtp.App\UplinkFtp.App.csproj -c Debug -p:Platform=x64
# Self-contained WASDK output includes a win-x64 RID folder:
.\src\UplinkFtp.App\bin\x64\Debug\net8.0-windows10.0.19041.0\win-x64\UplinkFtp.exe
```

> Prefer launching that **x64 / win-x64** exe. Plain `dotnet run` may look under `bin\Debug\…` and fail.

Optional unpackaged self-contained publish (bundles .NET + WASDK):

```powershell
dotnet publish src\UplinkFtp.App\UplinkFtp.App.csproj -c Release -p:Platform=x64 -p:PublishProfile=win-x64
```

## Tests (Linux or Windows)

```bash
cd UplinkFtp
dotnet test tests/UplinkFtp.Core.Tests/UplinkFtp.Core.Tests.csproj -c Release
```

## Linux / CI note

WinUI 3 targets `net8.0-windows10.0.*` and requires Windows App SDK tooling.

| Command | Linux agent | Windows + WinUI workload |
| --- | --- | --- |
| `dotnet restore` / Core tests | OK | OK |
| `dotnet build` App (XAML) | Fails: `XamlCompiler.exe` | OK |

## Docs

- [Licensing contract](docs/licensing-contract.md)  
- [Privacy policy (draft)](docs/privacy-policy.md)  
- [Security review](docs/security-review.md)  
- [Performance notes](docs/performance-notes.md)  
- [Release checklist](docs/release-checklist.md) · [Known issues](docs/known-issues.md) · [Changelog](docs/CHANGELOG.md) · [Support](docs/support.md)  
- Packaging: [MSIX](packaging/msix/README.md) · [Web/sideload](packaging/web/README.md)  

Coordinator durable docs (Project Context store): `docs/project-context.md`, roadmap, ADIM notes.
