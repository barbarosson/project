# Privacy policy stub — Pure Performance

**Status:** Draft stub for Microsoft Store Partner Center. Publish at a stable HTTPS URL before Store certification (suggested: `https://modulusaas.com/products/pure-performance/privacy`).

**Last updated:** 2026-11-17

## Who we are

Pure Performance is published by **Modulus** (“we”). Contact for privacy questions: use the support email listed on the Microsoft Store product page.

## What the app does on your PC

Pure Performance is a Windows desktop utility focused on **Crash Analyzer** and **Startup Manager**, with free cleanup/memory tools and an optional Pro feature tier.

- **Crash Analyzer** reads Windows **Application** and **System** Event Log entries on this device to explain recent crashes and shutdowns. Findings can be copied locally.
- **Startup Optimizer** lists and can enable/disable Run-key and Startup-folder entries using a reversible local backup.
- **System Cleaner** deletes files only in folders you select (for example user TEMP, Windows TEMP, Prefetch, browser caches). It is **not** a registry cleaner.
- **Memory Optimizer** may call `EmptyWorkingSet` on processes the app can open.
- **Theme / accent settings** are stored locally under your Windows user profile (`%LocalAppData%\PurePerformance`).
- **Optional Pro tools** (scheduled reports, advanced crash export, rules, alerts, profiles) store preferences and reports locally on this PC.
- **Optional Pro AI assist** sends a selected crash summary only to the **base URL you configure**, using an API key you provide. The key is stored in Windows PasswordVault on this device. The app does not ship with a built-in key and does not send AI traffic to Modulus servers.

## Data we collect

By default, Pure Performance:

- Does **not** require an account to use free tools.
- Does **not** upload Event Log contents, startup lists, or cleaned file paths to Modulus servers.
- Performs Microsoft Store license / purchase checks through the **Microsoft Store** when the app is installed from the Store (handled by Windows / Store services — see Microsoft’s privacy statement).

Optional Pro unlock uses Microsoft’s commerce APIs; purchase records are associated with your Microsoft account by Microsoft, not stored as a custom Modulus cloud profile inside this app. Multi-PC “cloud sync” is not active in this build — profiles stay local.

## Network access

The packaged app may use network access (`internetClient`) to:

- Check or purchase the optional Pro add-on via Microsoft Store
- Open the privacy policy or support links you tap in Settings
- Call an OpenAI-compatible endpoint **only if** you enable Pro AI assist and provide a base URL + API key

## Data retention

Local settings, reports, alert history, and reversible startup backups remain on your PC until you delete them or uninstall the app. We do not operate a Pure Performance cloud database of your crash logs in this stub release.

## Children’s privacy

Pure Performance is a general PC utility and is not directed at children under 13.

## Changes

We may update this policy. The Store listing and this document’s “Last updated” date will reflect material changes.

## Contact

Use the publisher support contact on the Microsoft Store listing for Pure Performance.
