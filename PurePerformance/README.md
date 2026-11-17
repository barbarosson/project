# Pure Performance

Windows desktop app (**WinUI 3**, **.NET 8**, **Windows App SDK**, **MSIX**):

**Crash Analyzer · Startup Manager · System Cleaner · Memory Optimizer · live performance dashboard**

Not a registry cleaner. Cleanup names exact folders; startup disable moves entries to a reversible backup.

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

Store package: right-click the project → **Package and Publish** → create MSIX upload package.

## What the app does

| Pane | Behavior |
|------|----------|
| **Dashboard** | Live CPU / RAM / Disk / GPU (best effort) + high-usage process list |
| **Crash Analyzer** | Scans Application + System Event Logs (24h / 72h) with plain-English fixes |
| **Startup Optimizer** | Lists HKCU/HKLM Run + Startup folders; enable/disable via reversible backup |
| **System Cleaner** | User TEMP, Windows TEMP, Prefetch, Chrome/Edge/Firefox caches — no registry cleaning |
| **Memory Optimizer** | `EmptyWorkingSet` on accessible processes; shows before/after available RAM |

UAC: everyday launch is `asInvoker`. Use **Relaunch as admin** only for HKLM / Common Startup / Windows Temp / Prefetch when Windows denies access. See `docs/UAC-AND-RUNFULLTRUST.md`.
