# Partner Center — Pure Performance Pro add-on

Honest freemium model for Microsoft Store:

| Tier | Included |
|------|----------|
| **Free** | Crash Analyzer (copyable findings), Dashboard, Startup Optimizer, System Cleaner (named folders), Memory Optimizer, theme + accent packs |
| **Pro (optional durable add-on)** | Scheduled scans + local summary reports, Advanced Crash Analyzer (trends/correlation/export), auto optimization rules, multi-PC local profiles (cloud sync scaffold), real-time CPU/disk alerts, Cleaner/Startup whitelist, optional bring-your-own AI assist |

This is **not** a registry cleaner and must not use deceptive “cleaned X MB of junk” marketing.

## Create the durable add-on

1. Open [Partner Center](https://partner.microsoft.com/dashboard) → your Pure Performance app.
2. **Products** → **Add-ons** → **Create new add-on**.
3. Product type: **Durable** (one-time unlock that stays with the Microsoft account).
4. Suggested product name: `Pure Performance Pro`.
5. Store listing copy (honest):
   - Unlocks scheduled reports, advanced crash tools, auto rules, profiles, alerts, whitelist, and optional AI assist (user-provided API key).
   - Crash Analyzer, Startup, Cleaner, and Memory remain available without this add-on.
   - Cleanup targets named folders only; no blind registry cleaning.
6. Price: set your one-time price (or free for testing).
7. After the add-on is created, copy its **Store ID** (looks like `9N…`).

## Wire the Store ID in the app

1. Open `src/PurePerformance.App/Services/StoreLicenseService.cs`.
2. Replace `DefaultProAddOnStoreId = "9NXXXXXXXXXX"` with the real Store ID.
3. Ship an MSIX update so packaged builds can call `StoreContext.RequestPurchaseAsync`.

Until the placeholder is replaced, the in-app **Unlock Pro…** button explains that Partner Center setup is incomplete — it will not fake a purchase.

## License check behavior

- Packaged Store builds: `StoreContext.GetAppLicenseAsync()` → active add-on license unlocks **this Pro tier only**.
- Unpackaged **Debug** F5: Pro is unlocked via an explicit **local/dev bypass** (UI warns this is not a Store receipt).
- Optional: set environment variable `PUREPERFORMANCE_UNLOCK_PRO=1` to force the same bypass (useful for unpackaged Release smoke tests).
- Never claim a Microsoft Store purchase when the bypass is active.

## AI assist (Pro)

- Users paste their own OpenAI-compatible API key in Settings.
- Key is stored in Windows PasswordVault on the device — never hardcoded in the app binary.
- Base URL + model are local settings; clear errors if the key/URL is missing.

## Listing keywords / positioning

Prefer: Crash Analyzer, Startup Manager, Event Log, BSOD, unexpected shutdown.

Avoid: “registry cleaner”, “boost PC 200%”, fake junk scores, forced cleanup drama.
