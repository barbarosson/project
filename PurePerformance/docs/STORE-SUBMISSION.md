# Microsoft Store submission checklist — Pure Performance

Position the app as **Crash Analyzer + Startup Manager**, with optional Pro productivity tools. Keep copy honest. **Not a registry cleaner.**

Detailed packaging steps: [`MSIX-PACKAGING.md`](MSIX-PACKAGING.md). Pro add-on: [`PARTNER-CENTER-ADDON.md`](PARTNER-CENTER-ADDON.md). Privacy stub: [`PRIVACY.md`](PRIVACY.md).

---

## Package identity (repo)

| Field | Value in repo | Notes |
|-------|----------------|-------|
| Package identity name | `Modulus.PurePerformance` | VS **Associate App with the Store** may rewrite to the reserved Store name |
| Display name | Pure Performance | Manifest + tiles |
| Publisher (`CN=…`) | `CN=Modulus` | **PLACEHOLDER** — must match Partner Center certificate after associate |
| Publisher display name | Modulus | Should match Partner Center publisher display name |
| Version | `1.0.0.0` | Bump for **every** Store upload |

### Versioning (keep in sync)

| Location | Property |
|----------|----------|
| `Package.appxmanifest` | `Identity/@Version` (`major.minor.build.revision`) |
| `PurePerformance.App.csproj` | `Version`, `FileVersion`, `AssemblyVersion`, `ApplicationDisplayVersion`, `ApplicationVersion` |
| `app.manifest` | `assemblyIdentity/@version` |

Store rule of thumb: increment at least the **build** or **revision** segment for each upload. `ApplicationDisplayVersion` is the user-visible `x.y.z`; `ApplicationVersion` is the integer revision used by the packaging tooling.

---

## Capabilities (keep minimal)

Declared in `Package.appxmanifest`:

- `internetClient` — Store license/purchase, privacy hyperlink, optional user-configured AI endpoint
- `runFullTrust` — Desktop Bridge for Event Log / startup / named-folder cleanup APIs (**needed**; do not remove)

Do **not** add unrelated restricted capabilities. Everyday launch stays `asInvoker`; elevate on demand (see `UAC-AND-RUNFULLTRUST.md`).

---

## Visual assets

Brand PNGs + `ApplicationIcon.ico` under `src/PurePerformance.App/Assets/` (teal pulse mark). Filenames/sizes: `Assets/README.md`. Manifest + unpackaged `ApplicationIcon` already reference them.

**Still Partner Center-only:** Store listing screenshots (≥1366×768) showing Crash Analyzer and Startup Manager — never fake “cleaned X MB” dashboards. Optional Store promo art sizes per Partner Center UI.

---

## Privacy policy

Partner Center requires a **live HTTPS** privacy policy URL.

| Item | Status |
|------|--------|
| Stub content | `docs/PRIVACY.md` in repo |
| In-app Settings link | `https://modulusaas.com/products/pure-performance/privacy` |
| Public page hosted | **Barbaros** — publish stub (or final policy) before certification |

---

## Freemium disclosure (Store listing copy)

State clearly in the Store description:

1. Crash Analyzer, Dashboard, Startup Optimizer, System Cleaner, and Memory Optimizer are **free**.
2. Optional **Pure Performance Pro** (durable add-on) unlocks scheduled reports, advanced crash tools, auto rules, profiles, alerts, whitelist, and bring-your-own AI assist.
3. Not a registry cleaner; cleanup names exact folders only.

### Pro add-on Store ID (**PLACEHOLDER**)

| Item | Value |
|------|--------|
| Code constant | `StoreLicenseService.DefaultProAddOnStoreId` |
| Current value | `9NXXXXXXXXXX` (**PLACEHOLDER — not a real Store ID**) |
| After Partner Center | Replace constant with the durable add-on Store ID (`9N…`), then ship an MSIX update |

Until replaced, **Unlock Pro…** explains that Partner Center setup is incomplete and will not fake a purchase. Settings shows the configured ID with a PLACEHOLDER label when still unset.

---

## Age rating / category

- Category suggestion: **Utilities & tools** / productivity utilities
- Declarations: local system diagnostics and optional folder cleanup; no account required for free tools

---

## Build / upload (summary)

1. On Windows: open `PurePerformance.sln` in Visual Studio 2022.
2. **Associate App with the Store** (rewrites publisher placeholders).
3. **Package and Publish** → **Create App Packages…** → Microsoft Store ready (see `MSIX-PACKAGING.md`).
4. Upload the `.msixupload` in Partner Center → complete listing → submit.

---

## Local testing without Store

Unpackaged Debug uses a labeled Pro bypass so F5 still exercises Pro panes. That bypass is **not** a Store license.

---

## Done in repo vs Partner Center only (Barbaros)

### Done in code / docs (this repo)

- [x] `Package.appxmanifest`: display name, tile logos, honest Crash Analyzer + Startup Manager descriptions, no registry-cleaner claims
- [x] Publisher / CN placeholders **documented** (not inventable without Partner Center)
- [x] Capabilities limited to `internetClient` + `runFullTrust`
- [x] Store-sized visual assets + ICO present under `Assets/`
- [x] Version fields wired in manifest + csproj + `app.manifest` (`1.0.0.0` baseline)
- [x] Privacy policy **stub file** + in-app URL pointing at suggested public path
- [x] Store checklist (`STORE-SUBMISSION.md`) + MSIX packaging notes (`MSIX-PACKAGING.md`)
- [x] Freemium model + Pro durable add-on docs; Store ID constant clearly marked `9NXXXXXXXXXX`
- [x] UAC / `asInvoker` + on-demand elevation notes

### Only Barbaros can finish in Partner Center / outside the repo

- [ ] Reserve / confirm app name and publisher account in Partner Center
- [ ] Run VS **Associate App with the Store** so `CN=…` matches the Store certificate (replace placeholder)
- [ ] Create **Pure Performance Pro** durable add-on; paste real Store ID into `StoreLicenseService` and ship update
- [ ] Publish privacy policy HTML at the HTTPS URL (content can start from `PRIVACY.md`)
- [ ] Capture and upload Store screenshots / optional promo art
- [ ] Fill Store listing (description, keywords, category, age rating questionnaire, support contact)
- [ ] Run **Create App Packages**, upload `.msixupload`, pass certification, set price / markets / rollout
- [ ] Respond to certification failures (capability justification, screenshot policy, metadata)

Suggested listing keywords: Crash Analyzer, Startup Manager, Event Log, BSOD, unexpected shutdown. Avoid: registry cleaner, “boost PC 200%”, fake junk scores.
