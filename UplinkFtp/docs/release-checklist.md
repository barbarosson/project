# Release checklist

Versioning starts at **0.1.0-beta** (see `CHANGELOG.md`). Check items before tagging a build.

## Every candidate

- [ ] `dotnet test tests/UplinkFtp.Core.Tests -c Release` green (Linux or Windows)  
- [ ] Windows: `dotnet build` / `run` unpackaged smoke (P0 — **user-owned**)  
- [ ] Free gates: 3 sites / 1 connection / 1 transfer observed on device  
- [ ] Pro path: Web validate **or** Store entitlement (no accidental stub keys in Release)  
- [ ] `AcceptAnyCertificate` default false; Settings copy warns if enabled  
- [ ] No secrets in logs / exported log file spot-check  
- [ ] Telemetry remains off unless user opts in  
- [ ] CHANGELOG updated; known-issues reviewed  

## Public beta extras

- [ ] Privacy policy draft reviewed (`privacy-policy.md`)  
- [ ] Security open items assigned (`security-review.md`)  
- [ ] Signed installer **or** Store flight (external — certs / Partner Center)  
- [ ] License API hosted **or** Store sandbox (external)  
- [ ] Support path published (`support.md`)  

## v1.0 extras

- [ ] Resume product decision documented (byte resume shipped or explicitly “restart only”)  
- [ ] Pool / Pro concurrency marketing matches behavior  
- [ ] a11y / l10n baseline  
- [ ] Store + Web shipping channels live  
- [ ] Security/privacy human sign-off  
- [ ] Windows soak criteria from `performance-notes.md` met  

## Explicitly not complete from scaffolding alone

Store publishing · code signing · backend deployment · Windows runtime smoke.
