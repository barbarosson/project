# Uplink FTP — Microsoft Store product identity

Values from Partner Center (public listing identity). **Do not invent** a Pro add-on Store ID here.

| Field | Value |
| --- | --- |
| Package / Identity / Name | `MODULUSTECH.UplinkFTP` |
| Package / Identity / Publisher | `CN=7E7A2323-C3C3-4A9A-A4D1-832D351FC4BA` |
| Publisher display name | `MODULUSTECH` |
| App display name | `Uplink FTP` |
| Package Family Name (PFN) | `MODULUSTECH.UplinkFTP_6w2d1brm94m3m` |
| Package SID | `S-1-15-2-4143100718-652327594-466145471-3640568159-3709408547-1417111450-2836629691` |
| Store ID | `9MZKMN2ZH0DG` |
| Store URL | https://apps.microsoft.com/detail/9MZKMN2ZH0DG |
| Store protocol | `ms-windows-store://pdp/?productid=9MZKMN2ZH0DG` |
| MSA app Id | `cfdf739f-0ce9-4f9f-8f5f-5d81927cb6f3` |
| Pro durable add-on Store ID | **FILL_IN** (create in Partner Center, then set `UPLINK_STORE_PRO_ADDON_ID`) |

## Wired in repo

- `src/UplinkFtp.App/Package.appxmanifest` — Name, Publisher, PublisherDisplayName  
- `StoreCommerceOptions.DefaultAppStoreId` / env `UPLINK_STORE_APP_ID` — `9MZKMN2ZH0DG`  
- `packaging/signing.env.example` — public identity + app Store ID defaults  

## Not in git

- Code-signing certificates / passwords (`signing.env` is gitignored)  
- Pro add-on Store ID until Partner Center creates the SKU  
