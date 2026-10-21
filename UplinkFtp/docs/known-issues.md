# Known issues (0.1.0-beta / unreleased)

Living list for dogfood and public beta. Update as defects are fixed.

## Platform / build

- Full WinUI build and run require Windows 10/11. App targets **Windows App SDK 2.5.1** with `WindowsAppSDKSelfContained=true` for unpackaged output (no separate Runtime 1.6 install).  
- Launch the self-contained output exe: `bin\x64\Debug\net8.0-windows10.0.19041.0\win-x64\UplinkFtp.exe`. Plain `dotnet run` may look under `bin\Debug\` and fail.  
- Linux agents run **Core tests only**.  
- **P0 Windows smoke is still user-owned** — not validated in cloud Linux agents.  

## Product gaps vs FileZilla-class expectations

- Directory transfers: pause restarts the directory job (no per-file directory resume UX yet).  
- File byte-resume depends on server/protocol support; edge servers may fail offset resume.  
- Site Manager / Settings / License dialogs exist but need Windows UI validation.  
- App settings are primarily in-memory until persistence lands.  
- SFTP host-key pinning UX incomplete (see `security-review.md`).  

## Licensing / distribution

- Production license backend hosting is an **external blocker** (sample only: `samples/LicenseApi`).  
- Client Debug stubs (`UPLINK-PRO*`) must stay disabled in Release shipping builds.  
- MSIX / web installer scripts remain fail-closed without a real signing cert — **no certs in repo**.  
- Store association / sandbox purchase / Partner Center submission remain **human** steps. App + Pro add-on Store IDs are wired in-repo (`docs/store/product-identity.md`).  

## Telemetry / privacy

- Opt-in telemetry has no production exporter yet (local logger only when enabled).  
- Privacy policy is publish-ready markdown with **FILL_IN_*** markers — needs hosted HTTPS URL.
