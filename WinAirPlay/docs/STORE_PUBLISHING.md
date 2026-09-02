# WinAirPlay — Microsoft Store Publishing

This guide covers MSIX packaging and Microsoft Store submission for WinAirPlay.

The packaged app is English-only, `win-x64`, and self-contained so Store PCs do not need a preinstalled .NET 8 Desktop Runtime.

## Requirements

- Windows 10 version 2004 (build 19041) or later — required for process loopback capture
- Visual Studio 2022 with **MSIX Packaging Tools** workload, **or** Build Tools + Windows SDK
- Microsoft Partner Center developer account
- Public HTTPS privacy policy: https://github.com/barbarosson/project/blob/cursor/winairplay-wpf-airplay-mute/WinAirPlay/docs/PRIVACY_POLICY.md
- Support email that matches Partner Center

## Project layout

```
src/WinAirPlay.Package/
  WinAirPlay.Package.wapproj   MSIX packaging project
  Package.appxmanifest         Store manifest (capabilities, min OS, en-US)
  Images/                      Tiles + 300×300 listing logo
src/WinAirPlay.App/app.manifest  asInvoker (no admin)
tools/GenerateStoreAssets/     Regenerates logos from AppLogoRenderer
THIRD_PARTY_NOTICES.txt        Shipped inside the MSIX
```

## Regenerate store logos

```powershell
dotnet run --project tools\GenerateStoreAssets\GenerateStoreAssets.csproj -- "src\WinAirPlay.Package\Images"
```

Writes 44 / 50 / 150 / 310 tiles, wide 310×150, and `StoreListingLogo300.png` for Partner Center (upload that 300×300 file in the listing; it is not the manifest `StoreLogo`).

## Build MSIX locally (sideload test)

Close WinAirPlay if it is running (the exe is locked during build).

```powershell
# From the WinAirPlay folder
.\scripts\build-msix.ps1
```

Output: `AppPackages\WinAirPlay.Package_<version>_x64_Test\`

Install the `.msix` from that folder to sideload. This uses the local PFX, **not** the Store identity.

### Visual Studio — Store package

1. Open `WinAirPlay.sln`
2. Right-click **WinAirPlay.Package** → **Publish** → **Associate App with the Store…** (once)
3. Set **WinAirPlay.Package** as startup project
4. Configuration: **Release | x64**
5. **Publish → Create App Packages…**
6. Choose **Microsoft Store** (not sideloading) for the upload payload
7. Run **Windows App Certification Kit** on that package before upload

## Manifest capabilities

| Capability | Purpose |
|------------|---------|
| `privateNetworkClientServer` | mDNS discovery, RTSP, RTP/UDP on LAN |
| `runFullTrust` | WPF desktop app, WASAPI loopback, system tray, default-output switch |

Minimum OS in manifest: **10.0.19041.0** (Windows 10 2004). Package version last digit must stay **0** (for example `1.0.0.0`).

## Partner Center checklist

1. **Associate** the packaging project with your Store app
2. Privacy policy URL (paste into Partner Center): https://github.com/barbarosson/project/blob/cursor/winairplay-wpf-airplay-mute/WinAirPlay/docs/PRIVACY_POLICY.md
   Use a real support email in the listing.
3. Upload **StoreListingLogo300.png** as the listing icon
4. Screenshots: 1920×1080 PNG — scan/device list, streaming, routing (Auto vs mute). English UI, no debugger chrome
5. Description must state: *Not affiliated with Apple Inc. AirPlay is a trademark of Apple Inc.*
6. Describe routing: optional VB-Audio Cable / VoiceMeeter; otherwise speakers mute; close hides to tray, Exit on the tray icon quits
7. Paste NAudio + Zeroconf MIT notice (or point at in-package `THIRD_PARTY_NOTICES.txt`)
8. Age rating: **Everyone** (IARC questionnaire — no account, no ads, no UGC)
9. Category: **Utilities & tools** or **Music**
10. Notes for certification: full-trust WPF, local network only, tray close behavior, default-device restore on disconnect/crash

### Listing copy (starting point)

Short: Stream Windows system audio to AirPlay speakers on your LAN, such as a HomePod.

Long: WinAirPlay captures what you hear on Windows and sends it to an AirPlay-compatible receiver on the same Wi-Fi network. It is not affiliated with Apple Inc. AirPlay is a trademark of Apple Inc.

If VB-Audio Cable or VoiceMeeter is installed, playback stays on your PC speakers and Windows volume keys control the HomePod. Otherwise compatibility mode mutes the PC speakers for the session. Closing the window hides WinAirPlay to the notification area; choose Exit on the tray icon to quit.

## Signing

- Local / sideload: temporary PFX (`WinAirPlay.Package_TemporaryKey.pfx`)
- Store: Microsoft re-signs after upload; use Partner Center association. Do not upload the `_Test` sideload package as your Store submission.

## CI note

WAP projects require MSBuild (Visual Studio Build Tools), not plain `dotnet build`:

```powershell
msbuild src\WinAirPlay.Package\WinAirPlay.Package.wapproj /p:Configuration=Release /p:Platform=x64 /restore
```

Install [MSIX Packaging Tools](https://learn.microsoft.com/en-us/windows/msix/desktop/desktop-to-uwp-packaging-dot-net) on the build agent.

## Troubleshooting

| Issue | Fix |
| --- | --- |
| MSB4019 DesktopBridge targets missing | Install VS workload “MSIX Packaging Tools” |
| File locked during build | Quit WinAirPlay from system tray |
| App fails on a clean PC | Pack with Release \| x64 so the runtime is self-contained |
| mDNS finds no devices | Same Wi‑Fi, private network profile, UDP 5353 allowed |
| Package rejected for AirPlay name | Disclaimer in listing and notes; no Apple logos; no “official” |
| Testers say the app will not close | Close → tray; Exit on the tray menu |
