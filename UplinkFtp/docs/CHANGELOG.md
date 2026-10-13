# Changelog

All notable changes to Uplink FTP are documented here.

Format inspired by [Keep a Changelog](https://keepachangelog.com/). Versioning starts at **0.1.0-beta**.

## [Unreleased]

### Added

- ADIM 1–6 client skeleton: WinUI shell, FluentFTP/SSH.NET, SQLite sites, PasswordVault credentials, transfer queue, Free/Pro licensing gates  
- `UplinkFtp.Core` library + xUnit tests (limits, path safety, queue, license, pool, load concurrency)  
- CI workflow for Linux Core tests + Windows WinUI build (`.github/workflows/uplink-ftp-ci.yml`)  
- Sample license validate API (`samples/LicenseApi`) — not production-hosted  
- Packaging scaffolds under `packaging/` (MSIX/web docs, scripts that refuse missing certs)  
- Docs: licensing contract, privacy draft, security review, performance notes, release checklist, support placeholder  

### Changed

- Stub Pro keys disabled by default in Release (`AllowStubKeys` / `UPLINK_ALLOW_STUB_KEYS`)  
- `AcceptAnyCertificate` defaults to false  
- **Windows App SDK 1.6 → 2.5.1** (NuGet stable); BuildTools → `10.0.26100.9169`  
- Unpackaged builds use `WindowsAppSDKSelfContained=true` (no EOL 1.6 Runtime install)  
- **UI shell redesign:** sectioned blocks (connect / log / local·remote / queue), Light·Dark·System theme via Settings, Sora + JetBrains Mono, warm-tech teal/amber palette  

### Added (UI)

- `Themes/Colors.xaml`, `Themes/Styles.xaml`, `Helpers/ThemeHelper.cs`  
- Embedded fonts under `Assets/Fonts/` (Sora, JetBrains Mono)  
- **AI Assist** dialog (toolbar **Assist**): URI parse + `IAiAssistantService` troubleshoot  
- **AI module scaffold:** BYOK Settings (Credential Locker `ai.apiKey`), `LocalAiAssistantService` + `CloudAiAssistantService`, checklist `docs/ai-module-checklist.md`, Cursor rule `.cursor/rules/uplink-ftp-ai-module.mdc`  
- App logo: `Assets/UplinkLogo.png`, `Assets/UplinkFtp.ico` (exe / taskbar / Store tile assets)  

### Fixed

- Sites / Settings / License / Transfer queue action buttons no longer clip horizontally (equal-column grids)  
- Drag-and-drop enqueue: WinUI Drop handlers now take a deferral (async drop was silently cancelled); panel-wide drop targets + **Upload →** / **← Download** buttons as fallback  
- Sites dialog: fit ContentDialog max width (~520px) so **Connect** / New·Add·Save·Delete no longer clip  
- Transfer queue: Free tier uploads reuse the primary SFTP session (no second pool connect); clearer remote permission / empty-exception messages  
- Scrollbars: rectangular (0 radius), thicker track/thumb, teal-muted colors app-wide (Settings / Sites / Assist / lists)  

## [0.1.0-beta] — TBD

First public beta tag — fill date when cut. Prerequisites: P0 Windows smoke, signed or Store flight path, license strategy without shipping stub keys.
