# Store / package assets

Teal pulse-on-navy Pure Performance mark (not a generic purple AI look).
`Package.appxmanifest` and unpackaged `ApplicationIcon` both use these files.

| File | Size | Use |
|------|------|-----|
| `StoreLogo.png` | 50×50 | Package Properties logo |
| `AppList.png` | 44×44 | App list companion (same art as Square44) |
| `Square44x44Logo.png` | 44×44 | App list / taskbar small (`uap:VisualElements`) |
| `Square71x71Logo.png` | 71×71 | Small tile |
| `Square150x150Logo.png` | 150×150 | Medium tile |
| `Square310x310Logo.png` | 310×310 | Large tile |
| `Wide310x150Logo.png` | 310×150 | Wide tile (mark + wordmark) |
| `SplashScreen.png` | 620×300 | Splash (mark + wordmark) |
| `ApplicationIcon.ico` | 16–256 | Unpackaged EXE / desktop shortcut (`ApplicationIcon` in csproj) |
| `AppIcon256.png` | 256×256 | Source plate for regenerating the ICO |

## Status

Package/tile PNGs and the unpackaged ICO are present at Store-required sizes (branded teal pulse mark). Replace with final marketing art only if Partner Center / brand review asks for a different look.

## Partner Center screenshots (not in this folder — Barbaros)

Upload desktop screenshots (≥1366×768) that show:

1. Crash Analyzer with honest Event Log findings  
2. Startup Manager (or Pro unlock screen — never fake cleanup scores)

See `docs/STORE-SUBMISSION.md` and `docs/MSIX-PACKAGING.md`.
