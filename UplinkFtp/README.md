# Uplink FTP

Modern FileZilla alternative for Windows — WinUI 3 / Windows App SDK, MVVM, FluentFTP, SSH.NET, EF Core + SQLite.

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
- Visual Studio 2022 17.8+ with **Windows App SDK / WinUI** workload  

## Build (on Windows)

```bash
cd UplinkFtp
dotnet restore UplinkFtp.sln
dotnet build UplinkFtp.sln -c Debug
dotnet run --project src/UplinkFtp.App/UplinkFtp.App.csproj
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
