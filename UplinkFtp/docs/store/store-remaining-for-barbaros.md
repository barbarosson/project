# Store remaining work for Barbaros

Partner Center **app identity** and **Pro add-on Store ID** are done in git. Canonical values: [product-identity.md](./product-identity.md).

## Done

| Item | Status |
| --- | --- |
| Package Identity Name `MODULUSTECH.UplinkFTP` | Done in `Package.appxmanifest` |
| Publisher `CN=7E7A2323-C3C3-4A9A-A4D1-832D351FC4BA` | Done |
| PublisherDisplayName `MODULUSTECH` | Done |
| DisplayName `Uplink FTP` | Done (unchanged) |
| Store ID `9MZKMN2ZH0DG` → `UPLINK_STORE_APP_ID` | Done |
| Pro durable add-on Store ID `9MTN64PZGQCM` → `UPLINK_STORE_PRO_ADDON_ID` | Done |
| PFN / Package SID / MSA app Id / Store URL documented | Done (`product-identity.md`) |
| Freemium + Buy Pro UX + Store channel scripts | Done in repo |
| Listing / IARC / capability drafts | Done in repo (`docs/store/*`) |

## Still yours

1. On Windows: VS **Associate App with the Store** (refresh PhoneIdentity / association XML if Partner Center expects it).  
2. Host public privacy URL (`FILL_IN_PRIVACY_POLICY_HTTPS_URL`) + support email FILL_INs.  
3. Capture real desktop screenshots (see `screenshot-shot-list.md`).  
4. Paste listing EN/TR, IARC answers, capability justifications into Partner Center.  
5. Sign / Store-sign Store-channel MSIX; sandbox Free → Buy Pro → limits lift.  
6. Submit certification flight.

## Do not commit

- `.pfx` / cert passwords / `signing.env`  
