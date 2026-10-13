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
- **Store commerce prep:** durable Pro add-on entitlement (`StoreEntitlementEvaluator`), env `UPLINK_STORE_PRO_ADDON_ID`, License **Buy Pro** → `RequestPurchaseAsync` (graceful if unassociated), Store/Web channel scripts, `docs/store/*` listing/IARC/capabilities, screenshot size placeholders  


### Changed

- Stub Pro keys disabled by default in Release (`AllowStubKeys` / `UPLINK_ALLOW_STUB_KEYS`)  
- `AcceptAnyCertificate` defaults to false  
- **Windows App SDK 1.6 → 2.5.1** (NuGet stable); BuildTools → `10.0.26100.9169`  
- Unpackaged builds use `WindowsAppSDKSelfContained=true` (no EOL 1.6 Runtime install)  
- **UI shell redesign:** sectioned blocks (connect / log / local·remote / queue), four named themes (Sun Rise / Orange / Red Night / ZEN), Sora + JetBrains Mono  
- **Store product identity:** `Package.appxmanifest` → `MODULUSTECH.UplinkFTP` / `CN=7E7A2323-…` / publisher `MODULUSTECH`; default `UPLINK_STORE_APP_ID=9MZKMN2ZH0DG` (`docs/store/product-identity.md`)  



### Added (UI)

- `Themes/Colors.xaml`, `Themes/Styles.xaml`, `Helpers/ThemeHelper.cs`  
- Embedded fonts under `Assets/Fonts/` (Sora, JetBrains Mono)  
- **Named themes (4):** Sun Rise (default), Orange, Red Night, ZEN (**Settings → Theme**; legacy Orbit/System/Light/Dark and Daybreak/Nightwatch/Harbor/Forge migrate automatically)  
- **AI Assist** hub (toolbar **Assist**): five tabs — Troubleshoot, Search, Batch, SSH, Quick Edit  
- Message log **Solve with AI**; Local/Remote NL **Filter**; Remote **AI Quick Edit** context menu  
- Protocol ops for AI apply paths: `RenameAsync`, `ReadTextFileAsync`, `WriteTextFileAsync`, `ExecuteShellCommandAsync` (SFTP)  
- **AI module:** BYOK Settings (Credential Locker `ai.apiKey`), `LocalAiAssistantService` + `CloudAiAssistantService`, `AiFileFilterMatcher`, checklist `docs/ai-module-checklist.md`, Cursor rule `.cursor/rules/uplink-ftp-ai-module.mdc`  
- App logo: `Assets/UplinkLogo.png`, `Assets/UplinkFtp.ico` (exe / taskbar / Store tile assets)  

### Fixed

- Sites / Settings / License / Transfer queue action buttons no longer clip horizontally (equal-column grids)  
- Drag-and-drop enqueue: WinUI Drop handlers now take a deferral (async drop was silently cancelled); panel-wide drop targets + **Upload →** / **← Download** buttons as fallback  
- Sites dialog: raise ContentDialog max width (~720–780px) so Protocol / actions / **Connect** / Close stay fully visible  
- Transfer queue: action buttons in a 2×3 grid; Free tier transfers use session-gated APIs; progress/UI updates use DispatcherQueue + isolated JobUpdated (stops COMException from failing uploads); clearer COM / permission messages  
- Scrollbars: rectangular (0 radius), thicker track/thumb, teal-muted colors app-wide (Settings / Sites / Assist / lists)  

## [0.1.0-beta] — TBD

First public beta tag — fill date when cut. Prerequisites: P0 Windows smoke, signed or Store flight path, license strategy without shipping stub keys.
