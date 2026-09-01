# WinAirPlay — Microsoft Store Publishing

This guide covers MSIX packaging and Microsoft Store submission for WinAirPlay.

## Requirements

- Windows 10 version 2004 (build 19041) or later — required for process loopback capture
- Visual Studio 2022 with **MSIX Packaging Tools** workload, **or** Build Tools + Windows SDK
- Microsoft Partner Center developer account
- Privacy policy URL (see `docs/PRIVACY_POLICY.md`)

## Project layout

```
src/WinAirPlay.Package/
  WinAirPlay.Package.wapproj   MSIX packaging project
  Package.appxmanifest         Store manifest (capabilities, min OS)
  Images/                      Store tile logos (PNG)
tools/GenerateStoreAssets/     Regenerates logos from AppLogoRenderer
```

## Regenerate store logos

```powershell
dotnet run --project tools\GenerateStoreAssets\GenerateStoreAssets.csproj
```

## Build MSIX locally

Close WinAirPlay if it is running (the exe is locked during build).

```powershell
# From the WinAirPlay folder
.\scripts\build-msix.ps1
```

Output: `AppPackages\WinAirPlay.Package_<version>_x64_Test\`

Install the `.msix` from that folder to sideload and test.

### Visual Studio

1. Open `WinAirPlay.sln`
2. Set **WinAirPlay.Package** as startup project
3. Configuration: **Release | x64**
4. **Project → Publish → Create App Packages…**
5. Choose **Microsoft Store using a new app name** (first time) or sideloading for local test

## Manifest capabilities

| Capability | Purpose |
|------------|---------|
| `privateNetworkClientServer` | mDNS discovery, RTSP, RTP/UDP on LAN |
| `runFullTrust` | WPF desktop app, WASAPI loopback, system tray |

Minimum OS in manifest: **10.0.19041.0** (Windows 10 2004).

## Partner Center checklist

Before submission:

1. **Associate** the packaging project with your Store app (Visual Studio: right-click Package project → Publish → Associate with the Store)
2. Replace placeholder **PublisherDisplayName** in Partner Center (not in code after association)
3. Upload **privacy policy** — host `docs/PRIVACY_POLICY.md` on a public URL
4. Add **THIRD_PARTY_NOTICES.txt** to Store listing or app description
5. Store description must state: *Not affiliated with Apple Inc. AirPlay is a trademark of Apple Inc.*
6. Screenshots: main window, device list, streaming state, settings
7. Age rating: likely **Everyone** (no restricted content)
8. Category: **Utilities & tools** or **Music**

## Signing

- Local / sideload: temporary PFX (`WinAirPlay.Package_TemporaryKey.pfx`) — generated on first VS build
- Store: Microsoft re-signs after upload; use Partner Center association

## CI note

WAP projects require MSBuild (Visual Studio Build Tools), not plain `dotnet build`:

```powershell
msbuild src\WinAirPlay.Package\WinAirPlay.Package.wapproj /p:Configuration=Release /p:Platform=x64 /restore
```

Install [MSIX Packaging Tools](https://learn.microsoft.com/en-us/windows/msix/desktop/desktop-to-uwp-packaging-dot-net) on the build agent.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| MSB4019 DesktopBridge targets missing | Install VS workload “MSIX Packaging Tools” |
| File locked during build | Quit WinAirPlay from system tray |
| mDNS finds no devices | Same Wi‑Fi, private network profile, UDP 5353 allowed |
| Package rejected for AirPlay name | Add disclaimer; avoid “official” / Apple logos |
