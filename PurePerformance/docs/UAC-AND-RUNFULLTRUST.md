# UAC and `runFullTrust` (next modules)

## Current foundation

- `Package.appxmanifest` declares **`runFullTrust`** so Pure Performance can use classic desktop APIs (Event Viewer, future startup enumeration) inside an MSIX Desktop Bridge package.
- `app.manifest` uses **`asInvoker`** — the app does **not** force an admin launch every time.
- Crash Analyzer Event Log reads are designed to work for standard users; access-denied paths surface a clear finding instead of crashing.

## Pattern for Startup Manager / deep cleanup

1. Detect admin with `ElevationHelper.IsRunningElevated()`.
2. Explain in the UI why elevation is needed for that specific action.
3. On user consent, call `ElevationHelper.TryRelaunchElevated()` (or a short-lived elevated helper process).
4. If the user cancels UAC or Windows returns access denied, show a graceful message and leave the system unchanged.

## What not to do

- Do not request `requireAdministrator` in the application manifest for everyday use.
- Do not pile on restricted capabilities that Store certification does not need.
- Do not implement aggressive registry cleaners or blind registry deletion — product positioning is Crash Analyzer + Startup Manager + **safe**, named cleanup only.
