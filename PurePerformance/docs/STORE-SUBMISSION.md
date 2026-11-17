# Microsoft Store submission checklist — Pure Performance

Position the app as **Crash Analyzer + Startup Manager**, with optional Pro productivity tools. Keep copy honest.

## Package identity

| Field | Value in repo |
|-------|----------------|
| Package identity name | `Modulus.PurePerformance` |
| Display name | Pure Performance |
| Publisher display name | Modulus |
| Version | `1.0.0.0` (bump for each Store upload) |

Update **Publisher** (`CN=…`) to match your Partner Center certificate before packaging.

## Capabilities (keep minimal)

Declared in `Package.appxmanifest`:

- `internetClient` — Store license/purchase, privacy hyperlink, optional user-configured AI endpoint
- `runFullTrust` — Desktop Bridge for Event Log / startup / cleanup APIs

Do **not** add unrelated restricted capabilities. Everyday launch stays `asInvoker`; elevate on demand (see `UAC-AND-RUNFULLTRUST.md`).

## Assets

Brand PNGs + `ApplicationIcon.ico` under `src/PurePerformance.App/Assets/` (teal pulse mark). Filenames/sizes are listed in `Assets/README.md`. `Package.appxmanifest` and unpackaged `ApplicationIcon` already reference them.

Partner Center also needs Store screenshots (desktop 1366×768 or larger) showing Crash Analyzer and Startup Manager — not fake “cleaned” dashboards.

## Privacy policy

Partner Center requires a privacy policy URL. Stub content lives in `docs/PRIVACY.md`.

Suggested public URL (publish the page before submission):

`https://modulusaas.com/products/pure-performance/privacy`

## Age rating / category

- Category suggestion: **Utilities & tools** / productivity utilities
- Declarations: local system diagnostics and optional folder cleanup; no account required for free tools

## Freemium disclosure

In Store description, state clearly:

1. Crash Analyzer, Dashboard, Startup Optimizer, System Cleaner, and Memory Optimizer are free.
2. Optional **Pure Performance Pro** (durable add-on) unlocks scheduled reports, advanced crash tools, auto rules, profiles, alerts, whitelist, and bring-your-own AI assist.
3. Not a registry cleaner.

See `PARTNER-CENTER-ADDON.md` for the durable add-on steps.

## Build / upload

1. On Windows: open `PurePerformance.sln` in Visual Studio 2022.
2. Set package identity / signing for Store.
3. Right-click project → **Package and Publish** → **Create App Packages…** → Microsoft Store ready.
4. Upload the `.msixupload` (or `.msix`) in Partner Center.

## Local testing without Store

Unpackaged Debug uses a labeled Pro bypass so F5 still exercises Pro panes. That bypass is **not** a Store license.
