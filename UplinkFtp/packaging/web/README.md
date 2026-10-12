# Web / sideload distribution

Scaffold for non-Store installs of the same WinUI binary.

## Sideload / bootstrapper notes

1. Build an unpackaged or MSIX sideload package on Windows (`UplinkDistributionChannel=Web`).  
2. Sign with your organization’s code-signing certificate (see `../signing.env.example`).  
3. Host the package + optional bootstrapper EXE on HTTPS (CDN / static site — **external**).  
4. Users enable sideloading (or use a signed MSIX with trusted publisher).  

`packaging/scripts/build-web-installer.ps1` is a scaffold that documents the publish steps and fails if signing env is missing. It does not invent certs or publish externally.

## Update channel design

| Channel | Mechanism |
| --- | --- |
| Store | OS / Store auto-update |
| Web | Appcast JSON (sample: `appcast.sample.json`) polled by a future updater |

Proposed web update flow:

1. Bootstrapper / app reads `https://<cdn>/uplinkftp/appcast.json` (URL not hardcoded in repo).  
2. Compare `version` to local assembly version.  
3. If newer, download `url` (MSIX or zip) over HTTPS and verify signature / hash.  
4. Prompt user → install → relaunch.  

`appcast.sample.json` uses **placeholders only** (`REPLACE_ME_*`). No production CDN URLs or hashes are committed.

## License

Web builds use `WebLicenseService` + `UPLINK_LICENSE_URL`. See `docs/licensing-contract.md` and `samples/LicenseApi/`.
