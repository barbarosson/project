# FTP AI

Modern FileZilla alternative for Windows — WinUI 3 / Windows App SDK, MVVM, FluentFTP, SSH.NET, EF Core + SQLite.

## Status

- **ADIM 1:** solution skeleton, folders, NuGet, DI
- **ADIM 2:** `IFtpService` with FluentFTP (FTP/FTPS) + SSH.NET (SFTP), list/upload/download (folder-aware), reconnect/keep-alive
- **ADIM 3:** SQLite Site Manager persistence + PasswordVault/DPAPI credentials (no passwords in DB)
- **ADIM 4:** Main UI — quick connect, log, local/remote browsers, drag-drop upload/download
- **ADIM 5:** Transfer queue — concurrent workers, Queued/Failed/Successful tabs, pause/resume (restart), Free-tier concurrency cap

## Requirements (Windows)

- Windows 10 version 1809+ / Windows 11
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- Visual Studio 2022 17.8+ with **Windows App SDK / WinUI** workload  
  - Workload ID: `Microsoft.VisualStudio.Workload.ManagedDesktop`  
  - Component: Windows App SDK C# Templates

## Build (on Windows)

```bash
cd FtpAi
dotnet restore FtpAi.sln
dotnet build FtpAi.sln -c Debug
dotnet run --project src/FtpAi.App/FtpAi.App.csproj
```

## Linux / CI note

WinUI 3 targets `net8.0-windows10.0.*` and requires Windows App SDK tooling.

| Command | Linux agent | Windows + WinUI workload |
| --- | --- | --- |
| `dotnet restore` | OK (`EnableWindowsTargeting=true`) | OK |
| `dotnet build` | Fails: `XamlCompiler.exe` Exec format error | OK |

Use a Windows VM or GitHub `windows-latest` runner for CI builds.

## Layout

Coordinator durable docs (Project Context store): `docs/project-context.md`, `docs/adim-1-setup.md`.
