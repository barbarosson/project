# Windows soak checklist (Uplink FTP)

**Owner:** Barbaros (Windows machine). Linux CI Core tests do **not** replace this.

Run against a real FTP/FTPS/SFTP server (lab or staging). Record pass/fail + notes in Partner Center flight notes or a local log.

## P0 smoke (every Store flight)

- [ ] Unpackaged launch: `UplinkFtp.exe` from self-contained `win-x64` output
- [ ] Packaged / Store install launch (same build channel as submission)
- [ ] Free → License → **Buy Pro** purchase UI appears (no COMException)
- [ ] After Pro: site limit / concurrent transfer / connection limits lift
- [ ] Quick connect FTP + FTPS + SFTP (password); SFTP private key path
- [ ] SFTP first-connect host-key prompt → **Pin and trust**; reconnect without prompt
- [ ] Settings Save → restart app → theme / timeouts / AI provider / AcceptAnyCertificate restored
- [ ] Transfer conflict **Ask** → choose Skip / Overwrite + **Apply to all**
- [ ] Directory upload: Pause mid-folder → Resume skips completed files (checkpoint)
- [ ] Queue: leave Failed/Queued jobs → restart app → jobs restored; Resume after connect
- [ ] Compare → **↑ diffs** / **↓ diffs** enqueue works
- [ ] Pro only: **Sync…** dry-run dialog → enqueue; Free must **not** show Sync button
- [ ] Sites: 4th site on Free opens License dialog
- [ ] Pin path on a saved-site session; bookmarks hint updates
- [ ] Assist BYOK: Troubleshoot + Search + Batch + Quick Edit with Gemini/OpenAI key; local fallback without key

## Soak / performance (before major listing push)

- [ ] Single large file (~1–4 GB) upload + download; UI stays responsive; memory stable
- [ ] Hundreds of small files directory transfer; pause/resume checkpoint correctness
- [ ] Pro multi-connection pool under sustained queue load
- [ ] Overnight idle connected session (SFTP keep-alive); no handle leak / crash
- [ ] MSIX vs unpackaged Credential Locker / DPAPI secret roundtrip
- [ ] Log export contains no passwords / API keys

## Store listing polish (manual — Partner Center)

- [ ] Replace placeholder screenshots with live UI captures (see `docs/store/screenshot-shot-list.md`)
- [ ] EN + TR listing copy synced with `docs/store/listing-copy.md`
- [ ] Age rating / capability justifications still accurate after feature adds
- [ ] Do **not** invent Partner Center uploads from agent-generated mock media alone — capture from a real Windows run

## Sign-off

| Date | Build / version | Tester | Result |
| --- | --- | --- | --- |
|  |  |  |  |
