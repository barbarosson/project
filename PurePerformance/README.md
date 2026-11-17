# Pure Performance

Windows desktop app (**WinUI 3**, **.NET 8**, **Windows App SDK**, **MSIX**):

**Crash Analyzer · Startup Manager · System Cleaner · Memory Optimizer · live performance dashboard**

Positioning for Store: **Crash Analyzer + Startup Manager**. Not a registry cleaner. Cleanup names exact folders; startup disable moves entries to a reversible backup. No deceptive junk-score cleanup claims.

## Feature tiers

| Tier | Features |
|------|----------|
| **Free** | Crash Analyzer (copyable), Dashboard, Startup Optimizer, System Cleaner, Memory Optimizer, Light/Dark/System theme, accent color packs |
| **Pro (optional durable add-on)** | Scheduled scans + local reports, Advanced Crash Analyzer, auto optimization rules, multi-PC profiles (local + cloud scaffold), real-time alerts, whitelist/rules, bring-your-own AI assist |

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

**Settings** (NavigationView gear):

- Light / Dark / Follow system (contrast-safe chips — always visible)
- Free accent packs: Windows / Ocean / Forest / Sunset / Slate / Berry
- License status + Unlock Pro…
- Pro AI assist: base URL, model, API key (PasswordVault) when Pro is unlocked

Preference is persisted under `%LocalAppData%\PurePerformance\user-settings.json` and applied on the main window root via `ElementTheme`.

## What the app does

| Pane | Tier | Behavior |
|------|------|----------|
| **Dashboard** | Free | Live CPU / RAM / Disk / GPU (best effort) + high-usage process list |
| **Crash Analyzer** | Free | Event Log scan; copyable details; optional Pro AI suggestions |
| **Startup Optimizer** | Free | HKCU/HKLM Run + Startup folders; reversible disable |
| **System Cleaner** | Free | Named temp/cache folders only — no registry cleaning |
| **Memory Optimizer** | Free | `EmptyWorkingSet` on accessible processes |
| **Scheduled scans** | Pro | Daily/weekly local Markdown summary (email stub) |
| **Advanced Crash** | Pro | Trends, correlations, export |
| **Auto rules** | Pro | Conditional cleanup/startup suggestions |
| **Profiles** | Pro | Local multi-profile; cloud sync scaffold (honest UI) |
| **Alerts** | Pro | CPU/disk spike InfoBar + history |
| **Whitelist / Rules** | Pro | Protect Cleaner paths / Startup entries |
| **Settings** | Free (+ Pro AI) | Theme, accents, license, optional AI key |

## Docs

- `docs/PARTNER-CENTER-ADDON.md` — durable Pro add-on setup  
- `docs/STORE-SUBMISSION.md` — MSIX / listing checklist  
- `docs/PRIVACY.md` — privacy policy stub for Partner Center  
- `docs/UAC-AND-RUNFULLTRUST.md` — elevation pattern  
