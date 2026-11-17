# Pure Performance

Windows desktop app (**WinUI 3**, **.NET 8**, **Windows App SDK**, **MSIX**) positioned for the Microsoft Store as:

**Crash Analyzer · Startup Manager · safe optimization tools**

It is **not** a registry cleaner. Cleanup features (when implemented) will name exactly which folders or files they touch. There is no aggressive or blind registry deletion.

## Solution layout

```
PurePerformance/
├── PurePerformance.sln
├── Directory.Build.props
├── README.md
├── docs/
│   └── UAC-AND-RUNFULLTRUST.md
└── src/
    └── PurePerformance.App/
        ├── PurePerformance.App.csproj
        ├── Package.appxmanifest      # runFullTrust, Store placeholders
        ├── app.manifest              # asInvoker (no forced admin)
        ├── App.xaml / App.xaml.cs
        ├── MainWindow.xaml(.cs)      # NavigationView shell
        ├── Program.cs
        ├── Models/
        ├── ViewModels/
        ├── Views/                    # Dashboard, Crash Analyzer, stubs
        ├── Services/                 # EventLogService + stubs
        ├── Helpers/                  # ElevationHelper, explanations
        └── Assets/                   # Store logo placeholders
```

## Open and build (Windows + Visual Studio)

1. Install **Visual Studio 2022** (17.8+) with workloads:
   - .NET desktop development
   - Windows application development (WinUI / Windows App SDK)
2. Open `PurePerformance/PurePerformance.sln`.
3. Set configuration to **Debug | x64** (or ARM64 on Snapdragon PCs).
4. Ensure the **Windows App SDK** runtime matching the package reference is installed (VS usually restores it).
5. Press **F5**. For Store packaging: right-click the project → **Package and Publish** → create an MSIX upload package.

### CLI (Windows Developer PowerShell)

```powershell
cd PurePerformance
dotnet restore PurePerformance.sln
dotnet build PurePerformance.sln -c Debug -p:Platform=x64
```

> **Cloud / Linux caveat:** WinUI 3 and Windows App SDK projects **do not compile** on non-Windows agents. Scaffolding and reviews can happen anywhere; builds and Store packaging require a Windows machine with the workloads above.

## What works in this foundation

| Area | Status |
|------|--------|
| Fluent shell (dark/light via system theme) | Done |
| Navigation: Dashboard, Crash Analyzer, Startup Optimizer, System Cleaner | Done (last two are stubs) |
| `EventLogService` — async Application + System log scan | Done |
| Crash Analyzer UI — 24h / 72h, explanations + fixes | Done |
| MSIX `runFullTrust` + asset placeholders | Done |
| Startup Manager / Temp Cleaner / Memory / live charts | Interfaces + stubs only |

## Store notes

- **Capability:** `runFullTrust` only for now — enough for Event Log and future desktop APIs without over-requesting.
- **Elevation:** everyday launch stays `asInvoker`; deep ops will prompt UAC on demand (`Helpers/ElevationHelper.cs`). See [docs/UAC-AND-RUNFULLTRUST.md](docs/UAC-AND-RUNFULLTRUST.md).
- **Certification copy:** emphasize diagnostics and safe startup/cleanup. Avoid “registry cleaner” claims.

## Product roadmap (out of scope here)

- PP-2 Startup Manager UI/logic  
- PP-3 System Cleaner + Memory Optimizer  
- PP-4 Live CPU/RAM/GPU dashboard charts  
