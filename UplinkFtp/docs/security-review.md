# Uplink FTP — Security review (working draft)

**Status:** Engineering threat model + open items. **Requires human sign-off** before public beta / v1.0.  
**Scope:** Client (`UplinkFtp.App` / `UplinkFtp.Core`), sample `LicenseApi`, packaging scaffolds.

## Threat model (summary)

| Asset | Threat | Mitigation in code | Residual risk |
| --- | --- | --- | --- |
| Server passwords / keys | Leak via DB, logs, telemetry | PasswordVault / DPAPI (`ICredentialStore`); passwords not in SQLite; telemetry scrub list | Malware with user privileges; memory dumps |
| License keys | Theft / sharing | Stored in credential store; Release disables stub keys unless `UPLINK_ALLOW_STUB_KEYS=1` | Sample API keys are non-production; real backend TBD |
| TLS (FTPS) | MITM via trust bypass | `AcceptAnyCertificate` **defaults false** (`AppSettings` / DI); FluentFTP `ValidateAnyCertificate` follows option | User can opt into insecure trust — must stay explicit in UI |
| Local path traversal | Write outside intended folder | `PathSafety.RejectTraversal` / `IsPathUnderRoot` on transfer paths | Cover all call sites; keep tests green |
| Remote path abuse | Unexpected remote deletes / overwrites | Operator-driven transfers only; no silent sync yet | Future sync features need extra review |
| Dependency supply chain | Malicious/vulnerable NuGet | Pin major deps (FluentFTP, SSH.NET, EF Core); CI restores known graph | Periodic `dotnet list package --vulnerable` still required |
| Packaging | Unsigned / spoofed installs | Scripts refuse to invent certs; signing.env placeholders only | Org must supply real certs off-repo |

## Implemented controls (verify in review)

1. **Credentials:** ADIM 3 path — sites in SQLite; secrets via PasswordVault/DPAPI.  
2. **TLS:** `ConnectionOptions.AcceptAnyCertificate` default `false`; Settings UI exposes the risk.  
3. **Path safety:** `Helpers/PathSafety` + unit tests.  
4. **Stub license keys:** `WebLicenseOptions.AllowStubKeys` false in Release; additional env gate in `WebLicenseService.IsStubProKey`.  
5. **Telemetry:** `TelemetryService` opt-in, secret scrubbing — see `docs/privacy-policy.md`.  
6. **License sample:** `samples/LicenseApi` uses SAMPLE keys only in Development; no production secrets committed.

## TelemetryService

Documented in privacy policy. Location: `src/UplinkFtp.Core/Services/Privacy/TelemetryService.cs`. Wired in `App.xaml.cs` with `optedIn: settings.TelemetryOptIn` (default false).

## Dependency notes

| Package | Role | Notes |
| --- | --- | --- |
| FluentFTP | FTP/FTPS | Cert validation tied to `AcceptAnyCertificate` |
| SSH.NET | SFTP | Key/password auth; host-key prompt + pin (`SshHostKeyVerifier` / `ssh-host-keys.json`) |
| EF Core + SQLite | Sites | `EnsureCreated` only — migrations / backup policy open |
| CommunityToolkit.Mvvm | UI | No network |
| Windows App SDK / WinUI | Shell | Store APIs only on Store channel |

Run before each release candidate:

```bash
dotnet list src/UplinkFtp.Core/UplinkFtp.Core.csproj --vulnerable
dotnet list src/UplinkFtp.App/UplinkFtp.App.csproj --vulnerable
```

## Open items (human sign-off required)

- [ ] Windows smoke: PasswordVault on unpackaged + packaged builds  
- [ ] Confirm no password strings in Release log export  
- [ ] Production license host + signing key custody  
- [ ] Code signing certificate + Partner Center publisher CN  
- [x] Host key verification UX for SFTP (prompt / pin) — MVP shipped; Windows soak still required  

- [ ] FTPS custom trust store / pin policy beyond AcceptAny toggle  
- [ ] Dependency vulnerability scan on release branch  
- [ ] Legal review of privacy policy draft  
- [ ] Penetration / abuse test of path safety on Windows paths  

**Do not mark Store publishing, code signing, backend deployment, or Windows runtime smoke as complete** until those checkboxes are owned and done outside this scaffold.
