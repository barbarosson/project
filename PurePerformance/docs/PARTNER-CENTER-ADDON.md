# Partner Center — Pure Performance Pro add-on

Honest freemium model for Microsoft Store:

| Tier | Included |
|------|----------|
| **Free** | Crash Analyzer (Event Log diagnosis) + live Dashboard |
| **Pro (optional)** | Startup Manager, System Cleaner (named folders only), Memory Optimizer |

This is **not** a registry cleaner and must not use deceptive “cleaned X MB of junk” marketing.

## Create the durable add-on

1. Open [Partner Center](https://partner.microsoft.com/dashboard) → your Pure Performance app.
2. **Products** → **Add-ons** → **Create new add-on**.
3. Product type: **Durable** (one-time unlock that stays with the Microsoft account).
4. Suggested product name: `Pure Performance Pro`.
5. Store listing copy (honest):
   - Unlocks Startup Manager, System Cleaner, and Memory Optimizer.
   - Crash Analyzer remains available without this add-on.
   - Cleanup targets named folders only; no blind registry cleaning.
6. Price: set your one-time price (or free for testing).
7. After the add-on is created, copy its **Store ID** (looks like `9N…`).

## Wire the Store ID in the app

1. Open `src/PurePerformance.App/Services/StoreLicenseService.cs`.
2. Replace `DefaultProAddOnStoreId = "9NXXXXXXXXXX"` with the real Store ID.
3. Ship an MSIX update so packaged builds can call `StoreContext.RequestPurchaseAsync`.

Until the placeholder is replaced, the in-app **Unlock Pro…** button explains that Partner Center setup is incomplete — it will not fake a purchase.

## License check behavior

- Packaged Store builds: `StoreContext.GetAppLicenseAsync()` → active add-on license unlocks Pro.
- Unpackaged **Debug** F5: Pro is unlocked via an explicit **local/dev bypass** (UI warns this is not a Store receipt).
- Optional: set environment variable `PUREPERFORMANCE_UNLOCK_PRO=1` to force the same bypass (useful for unpackaged Release smoke tests).
- Never claim a Microsoft Store purchase when the bypass is active.

## Listing keywords / positioning

Prefer: Crash Analyzer, Startup Manager, Event Log, BSOD, unexpected shutdown.

Avoid: “registry cleaner”, “boost PC 200%”, fake junk scores, forced cleanup drama.
