# Pure Performance

Windows desktop app (**WinUI 3**, **.NET 8**, **Windows App SDK**, **MSIX**):

**Crash Analyzer · Startup Manager · System Cleaner · Memory Optimizer · live performance dashboard**

Positioning for Store: **Crash Analyzer + Startup Manager**. Not a registry cleaner. Cleanup names exact folders; startup disable moves entries to a reversible backup. No deceptive junk-score cleanup claims.

## Feature tiers

| Tier | Features |
|------|----------|
| **Free** | Crash Analyzer + Dashboard |
| **Pro (optional)** | Startup Optimizer, System Cleaner, Memory Optimizer |

Unpackaged **Debug** F5 unlocks Pro via a labeled local/dev bypass so tools stay testable without Store. Packaged builds use `Windows.Services.Store` (`StoreContext`). See `docs/PARTNER-CENTER-ADDON.md`.

## Run on Windows (Visual Studio)

1. Install **Visual Studio 2022** (17.8+) with:
   - .NET desktop development  
   - Windows application development (WinUI / Windows App SDK)
2. Open `PurePerformance/PurePerformance.sln`.
3. Set **Debug | x64** (or **ARM64** on Snapdragon).
4. Press **F5**.

Optional CLI:

```powershell
cd PurePerformance
dotnet restore PurePerformance.sln
dotnet build PurePerformance.sln -c Debug -p:Platform=x64
```

Store package: right-click the project → **Package and Publish** → create MSIX upload package. Checklist: `docs/STORE-SUBMISSION.md`.

## Settings

**Settings** (NavigationView gear): Light / Dark / Follow system. Preference is persisted under `%LocalAppData%\PurePerformance\user-settings.json` and applied on the main window root via `ElementTheme` — the app does **not** set `Application.RequestedTheme` to `Default` (that caused WMC0055).

## What the app does

| Pane | Behavior |
|------|----------|
| **Dashboard** | Live CPU / RAM / Disk / GPU (best effort) + high-usage process list |
| **Crash Analyzer** | Scans Application + System Event Logs (24h / 72h) with plain-English fixes (**free**) |
| **Startup Optimizer** | Lists HKCU/HKLM Run + Startup folders; enable/disable via reversible backup (**Pro**) |
| **System Cleaner** | User TEMP, Windows TEMP, Prefetch, Chrome/Edge/Firefox caches — no registry cleaning (**Pro**) |
| **Memory Optimizer** | `EmptyWorkingSet` on accessible processes; shows before/after available RAM (**Pro**) |
| **Settings** | Theme + Pro license / purchase |

UAC: everyday launch is `asInvoker`. Use **Relaunch as admin** only for HKLM / Common Startup / Windows Temp / Prefetch when Windows denies access. See `docs/UAC-AND-RUNFULLTRUST.md`.

## Docs

- `docs/PARTNER-CENTER-ADDON.md` — durable Pro add-on setup  
- `docs/STORE-SUBMISSION.md` — MSIX / listing checklist  
- `docs/PRIVACY.md` — privacy policy stub for Partner Center  
- `docs/UAC-AND-RUNFULLTRUST.md` — elevation pattern  
