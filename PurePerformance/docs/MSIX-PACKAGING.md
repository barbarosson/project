# MSIX packaging — Visual Studio + Partner Center

How to produce a Store upload package for Pure Performance on **Windows** with **Visual Studio 2022**.

Local F5 stays unpackaged (`WindowsPackageType=None` in the `.csproj`). Store packaging uses `Package.appxmanifest` via the **Package and Publish** menu (`EnableMsixTooling` / `HasPackageAndPublishMenu`).

## Before you package

1. **Reserve the app** in [Partner Center](https://partner.microsoft.com/dashboard) (name: Pure Performance) if not already reserved.
2. **Publisher placeholders** in `Package.appxmanifest`:
   - `Identity/@Publisher` is currently `CN=Modulus` (**PLACEHOLDER**).
   - Associate the project with the Store so VS rewrites `Name` + `Publisher` to the reserved identity.
3. **Version**: set `Identity/@Version` (e.g. `1.0.0.0` → `1.0.1.0`) and keep `ApplicationDisplayVersion` / `ApplicationVersion` in the `.csproj` in sync (see versioning table in `STORE-SUBMISSION.md`).
4. Confirm logos under `src/PurePerformance.App/Assets/` (sizes in `Assets/README.md`).
5. Pro add-on Store ID may still be `9NXXXXXXXXXX` for the first app package; create the durable add-on in Partner Center, then ship a follow-up build with the real ID (see `PARTNER-CENTER-ADDON.md`).

## Visual Studio — Create App Packages

1. Open `PurePerformance/PurePerformance.sln` in Visual Studio 2022 (17.8+).
2. Configuration: **Release**, platform **x64** (also produce **ARM64** and/or **x86** if you support those Store architectures).
3. Right-click **PurePerformance.App** → **Package and Publish** → **Associate App with the Store…**
   - Sign in with the Partner Center Microsoft account.
   - Select the reserved Pure Performance app.
   - This updates publisher / package name placeholders to the Store values.
4. Right-click **PurePerformance.App** → **Package and Publish** → **Create App Packages…**
5. Wizard choices (typical Store path):
   - Distribution: **Microsoft Store under a new app name** / existing reserved name (after associate).
   - Generate app bundles: **Always**.
   - Include public symbol packages if you want Partner Center crash analytics.
   - Select architectures you ship (at least **x64**; add **ARM64** for Snapdragon PCs).
6. Finish the wizard. Output folder contains `.msixupload` (preferred for Store) and/or `.msix` / `.msixbundle`.

### If “Create App Packages” is missing

- Confirm `EnableMsixTooling` is `true` and `HasPackageAndPublishMenu` is set (already in the `.csproj`).
- Install **Windows application development** / WinUI workload and the Windows 10/11 SDK matching the project.
- Reload the project after restoring NuGet packages (`Microsoft.WindowsAppSDK`).

### Unpackaged vs packaged

| Mode | How | License behavior |
|------|-----|------------------|
| Unpackaged Debug F5 | Default (`WindowsPackageType=None`) | Labeled local Pro bypass |
| Store / MSIX | Create App Packages wizard | Real `StoreContext` license + purchase |

Do **not** treat the Debug bypass as a Store receipt.

## Partner Center — upload

1. Partner Center → Pure Performance → **Packages**.
2. Upload the `.msixupload` from the VS output folder.
3. Complete Store listing fields (see `STORE-SUBMISSION.md`): description, screenshots, category, age rating, privacy URL.
4. Submit for certification.

## Signing notes

- Store-associated packages are signed for Store distribution through the Partner Center / VS association flow.
- Sideload-only test packages use a different certificate path — do not upload sideload-only packages as the production Store submission unless Partner Center accepts that package type for your account flow.
- Never commit private `.pfx` keys to the repo.

## Related docs

- `STORE-SUBMISSION.md` — full checklist + code-done vs Partner Center-only
- `PARTNER-CENTER-ADDON.md` — Pure Performance Pro durable add-on
- `PRIVACY.md` — privacy policy stub to publish at the HTTPS URL
- `UAC-AND-RUNFULLTRUST.md` — why `runFullTrust` + `asInvoker`
