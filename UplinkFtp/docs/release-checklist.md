# Release checklist

Versioning starts at **0.1.0-beta** (see `CHANGELOG.md`). Check items before tagging a build.

## Every candidate

- [ ] `dotnet test tests/UplinkFtp.Core.Tests -c Release` green (Linux or Windows)  
- [ ] Windows: `dotnet build` / `run` unpackaged smoke (P0 — **user-owned**)  
- [ ] Free gates: 3 sites / 1 connection / 1 transfer observed on device  
- [ ] Pro path: Web validate **or** Store add-on / purchase (no accidental stub keys in Release)  
- [ ] `AcceptAnyCertificate` default false; Settings copy warns if enabled  
- [ ] No secrets in logs / exported log file spot-check  
- [ ] Telemetry remains off unless user opts in  
- [ ] CHANGELOG updated; known-issues reviewed  

## Microsoft Store (agent prep vs Barbaros)

### Done in repo (do not re-implement)

- [x] Store channel build scripts (`packaging/scripts/build-store-channel.ps1`)  
- [x] Fail-closed signing scaffold (`build-msix.ps1`)  
- [x] Freemium + durable Pro add-on entitlement + Buy Pro UX  
- [x] Configurable `UPLINK_STORE_PRO_ADDON_ID` / `UPLINK_STORE_APP_ID`  
- [x] Capability justification draft (`docs/store/capability-justifications.md`)  
- [x] Listing copy EN + TR (`docs/store/listing-copy.md`)  
- [x] Privacy policy draft with FILL_IN markers  
- [x] Screenshot shot list + size placeholders (`packaging/store-assets/`)  
- [x] Age rating questionnaire draft  

### Barbaros before first certification

- [x] Partner Center app reservation + package identity (`docs/store/product-identity.md`)  
- [ ] Create durable **Uplink FTP Pro** add-on SKU; set `UPLINK_STORE_PRO_ADDON_ID`  
- [ ] Public **FILL_IN_PRIVACY_POLICY_HTTPS_URL** hosted  
- [ ] VS Associate App with the Store on Windows (refresh association / PhoneIdentity if needed)  
- [ ] Store-channel MSIX signed / Store-signed  
- [ ] Real desktop screenshots (not placeholders)  
- [ ] Listing + IARC + capability justifications pasted  
- [ ] Sandbox: Free → purchase Pro → limits lift  
- [ ] Submit certification flight  

## Public beta extras

- [ ] Privacy policy reviewed and hosted  
- [ ] Security open items assigned (`security-review.md`)  
- [ ] Support path published (`support.md` FILL_INs)  
- [ ] License API hosted **or** Store sandbox verified  

## v1.0 extras

- [ ] Resume product decision documented  
- [ ] Pool / Pro concurrency marketing matches behavior  
- [ ] a11y / l10n baseline  
- [ ] Store + Web shipping channels live  
- [ ] Security/privacy human sign-off  
- [ ] Windows soak criteria from `performance-notes.md` met  

## Explicitly external

Partner Center · code signing certs · privacy URL hosting · device screenshots · certification submit.
