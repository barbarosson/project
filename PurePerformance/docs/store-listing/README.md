# Microsoft Store listing package — Pure Performance

Ready-to-upload listing copy and visuals for **Barbaros** / Partner Center.  
Positioning: **Crash Analyzer + Startup Manager**. Honest freemium. **Not a registry cleaner.**

Related docs: [`../STORE-SUBMISSION.md`](../STORE-SUBMISSION.md) · [`../MSIX-PACKAGING.md`](../MSIX-PACKAGING.md) · [`../PARTNER-CENTER-ADDON.md`](../PARTNER-CENTER-ADDON.md) · [`../PRIVACY.md`](../PRIVACY.md)

---

## Folder layout

| Path | Contents |
|------|----------|
| `listing-en.md` | English short/long description, features, keywords, what’s new |
| `listing-tr.md` | Turkish equivalents |
| `screenshots/` | Store desktop screenshots at **1920×1080** and **1366×768** |
| `icon/` | Copies of package/tile logos from `src/PurePerformance.App/Assets/` |
| `README.md` | This Partner Center upload checklist |

> Screenshots are polished **UI-language mock PNGs** (WinUI 3 / Fluent layout + teal pulse branding). Replace with captures from a real Windows F5/build when available — keep the same panes and honest messaging.

---

## Partner Center upload checklist

### 1. Store listings (Properties → Store listings)

For each language (at least **English** and **Turkish**):

| Partner Center field | Source file | Notes |
|----------------------|-------------|--------|
| Product name | `listing-*.md` → App name | Keep **Pure Performance** |
| Description (short) | Short description | ≤ ~200 characters |
| Description | Long description | Paste as-is; trim if UI rejects length |
| What’s new | What’s new (v1.0) | Update on each Store submission |
| Search terms | Keywords section | Avoid “registry cleaner”, “boost PC”, fake junk scores |
| Features (if exposed) | Feature bullets | Optional; also covered in long description |

Also set:

- [ ] Category: **Utilities & tools**
- [ ] Support contact / website
- [ ] Privacy policy URL (HTTPS): `https://modulusaas.com/products/pure-performance/privacy` — publish page from [`../PRIVACY.md`](../PRIVACY.md) first
- [ ] Age rating questionnaire completed honestly

### 2. Screenshots (Store listings → Platform → Windows 10/11 desktop)

Upload **at least 1** desktop screenshot; recommend **all five** panes below.  
Minimum size Partner Center accepts for desktop: **1366×768**. Prefer **1920×1080**.

| Upload order | File (prefer 1920) | Shows |
|--------------|--------------------|--------|
| 1 | `screenshots/01-dashboard-1920x1080.png` | Live dashboard / brand first impression |
| 2 | `screenshots/02-crash-analyzer-1920x1080.png` | Crash Analyzer (primary positioning) |
| 3 | `screenshots/03-startup-optimizer-1920x1080.png` | Startup Manager (primary positioning) |
| 4 | `screenshots/04-settings-theme-1920x1080.png` | Themes / accents / free tier honesty |
| 5 | `screenshots/05-pro-unlock-1920x1080.png` | Optional Pro durable add-on |

1366×768 twins are in the same folder if you need the minimum size explicitly.

**Do not upload:** fake “cleaned X MB” dashboards, registry-cleaner before/after art, or inflated junk scores.

### 3. Store logos / package logos (which size goes where)

#### A. Inside the MSIX package (already wired in repo)

These live under `src/PurePerformance.App/Assets/` and are **copied** here under `icon/` for Partner Center reference:

| File in `icon/` | Size | Used for |
|-----------------|------|----------|
| `StoreLogo.png` | 50×50 | Package Properties logo (`Package.appxmanifest` → `Properties/Logo`) |
| `Square44x44Logo.png` | 44×44 | App list / taskbar small |
| `AppList.png` | 44×44 | Companion app-list art |
| `Square71x71Logo.png` | 71×71 | Small tile |
| `Square150x150Logo.png` | 150×150 | Medium tile |
| `Square310x310Logo.png` | 310×310 | Large tile |
| `Wide310x150Logo.png` | 310×150 | Wide tile |
| `SplashScreen.png` | 620×300 | Splash |
| `AppIcon256.png` | 256×256 | Source plate / marketing reference |
| `ApplicationIcon.ico` | multi | Unpackaged EXE / desktop shortcut |

Manifest references are already set — you normally **do not** re-upload these into Partner Center as package assets; they ship inside the `.msixupload`.

#### B. Partner Center Store display / promo art (upload in Partner Center UI)

Partner Center fields vary by form version. Typical desktop Store images:

| Partner Center slot | Recommended size | What to use |
|---------------------|------------------|-------------|
| Desktop screenshots | **1366×768** min, **1920×1080** preferred | `screenshots/*` |
| Store logo / square logo (if requested separately) | **300×300** (or 1:1) | Scale from `icon/Square310x310Logo.png` or `AppIcon256.png` |
| 9:16 poster / portrait (optional) | per PC UI | Optional; not required for this pack |
| 1:1 box art / tile (optional) | 2400×2400 or per PC UI | Optional promo; brand mark on navy |
| Trailer (optional) | MP4 | Not included in this pack |

If Partner Center asks for a size not listed, regenerate from `icon/AppIcon256.png` or `Square310x310Logo.png` (teal pulse on navy) — do not invent a different brand mark.

### 4. Freemium & Pro add-on

- [ ] Listing text clearly states free core tools + optional Pro  
- [ ] Create durable add-on **Pure Performance Pro** (see [`../PARTNER-CENTER-ADDON.md`](../PARTNER-CENTER-ADDON.md))  
- [ ] Replace `9NXXXXXXXXXX` PLACEHOLDER in `StoreLicenseService` and ship MSIX update  

### 5. Package upload

- [ ] Associate App with the Store in Visual Studio (rewrites publisher `CN=…`)  
- [ ] Create App Packages → upload `.msixupload`  
- [ ] Submit for certification  

Full steps: [`../MSIX-PACKAGING.md`](../MSIX-PACKAGING.md) · [`../STORE-SUBMISSION.md`](../STORE-SUBMISSION.md)

---

## Screenshot notes for reviewers

| Pane | Message to certification |
|------|--------------------------|
| Crash Analyzer | Event Log read-only diagnosis; copyable findings; no deletion |
| Startup | Reversible backup disable — **not** a registry cleaner |
| Cleaner (not shown as primary) | Named folders only if you add a 6th shot later |
| Pro | Optional durable add-on; free tools remain free |

---

## Regenerating mocks

Mocks were rendered to match WinUI NavigationView layout and teal Ocean accent. When a Windows build is available, capture the same five panes at ≥1366×768 and replace the PNGs, keeping filenames so this checklist stays valid.
