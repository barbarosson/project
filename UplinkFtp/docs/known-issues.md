# Known issues (0.1.0-beta / unreleased)

Living list for dogfood and public beta. Update as defects are fixed.

## Platform / build

- Full WinUI build and run require Windows 10/11. App targets **Windows App SDK 2.5.1** with `WindowsAppSDKSelfContained=true` for unpackaged output (no separate Runtime 1.6 install).  
- Launch the self-contained output exe: `bin\x64\Debug\net8.0-windows10.0.19041.0\win-x64\UplinkFtp.exe`. Plain `dotnet run` may look under `bin\Debug\` and fail.  
- Linux agents run **Core tests only**.  
- **P0 Windows smoke is still user-owned** — see `docs/windows-soak-checklist.md`.  

## Product gaps vs FileZilla-class expectations

- Directory transfers now checkpoint completed relative paths on pause/resume; nested conflict Ask inside a directory walk still follows the job-level policy (no per-child Ask UI yet).  
- File byte-resume depends on server/protocol support; edge servers may fail offset resume.  
- Site Manager / Settings / License dialogs exist but need Windows UI validation on each flight.  
- ~~App settings are primarily in-memory~~ **Fixed:** non-secret settings persist to LocalAppData JSON.  
- ~~SFTP host-key pinning UX incomplete~~ **Fixed (MVP):** first-connect / mismatch prompt + pin store; FTPS custom CA trust store still open.  
- Pro **Scripting** feature flag has no product UI yet — do not promise in Store listing.  
- Multi-remote tabs / proxy / rate limit still absent.  

## Licensing / distribution

- Production license backend hosting is an **external blocker** (sample only: `samples/LicenseApi`).  
- Client Debug stubs (`UPLINK-PRO*`) must stay disabled in Release shipping builds.  
- MSIX / web installer scripts remain fail-closed without a real signing cert — **no certs in repo**.  
- Store association / sandbox purchase / Partner Center submission remain **human** steps. App + Pro add-on Store IDs are wired in-repo (`docs/store/product-identity.md`).  

## Telemetry / privacy

- Opt-in telemetry has no production exporter yet (local logger only when enabled).  
- Privacy policy is publish-ready markdown with **FILL_IN_*** markers — needs hosted HTTPS URL.
