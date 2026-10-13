# Store remaining work for Barbaros

Partner Center **app identity is done** in git. Canonical values: [product-identity.md](./product-identity.md).

> Also intended for the agent Context store at `docs/store-remaining-for-barbaros.md` (that mount may be unavailable in some agent VMs — this repo copy is authoritative).

## Done

| Item | Status |
| --- | --- |
| Package Identity Name `MODULUSTECH.UplinkFTP` | Done in `Package.appxmanifest` |
| Publisher `CN=7E7A2323-C3C3-4A9A-A4D1-832D351FC4BA` | Done |
| PublisherDisplayName `MODULUSTECH` | Done |
| DisplayName `Uplink FTP` | Done (unchanged) |
| Store ID `9MZKMN2ZH0DG` → `UPLINK_STORE_APP_ID` | Done (default + `signing.env.example`) |
| PFN / Package SID / MSA app Id / Store URL documented | Done (`product-identity.md`) |
| Freemium + Buy Pro UX + Store channel scripts | Done in repo |
| Listing / IARC / capability drafts | Done in repo (`docs/store/*`) |

## Still yours

1. **Create durable add-on** “Uplink FTP Pro” in Partner Center → copy Store ID → set local `UPLINK_STORE_PRO_ADDON_ID` (still **FILL_IN** — do not invent).  
2. On Windows: VS **Associate App with the Store** (refresh PhoneIdentity / association XML if Partner Center expects it).  
3. Host public privacy URL (`FILL_IN_PRIVACY_POLICY_HTTPS_URL`) + support email FILL_INs.  
4. Capture real desktop screenshots (see `screenshot-shot-list.md`).  
5. Paste listing EN/TR, IARC answers, capability justifications into Partner Center.  
6. Sign / Store-sign Store-channel MSIX; sandbox Free → Buy Pro → limits lift.  
7. Submit certification flight.

## Do not commit

- `.pfx` / cert passwords / `signing.env`  
- Invented Pro add-on Store IDs  
