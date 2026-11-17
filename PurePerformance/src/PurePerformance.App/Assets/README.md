# Store / package assets

Replace these placeholder PNGs with final art before Store certification.

| File | Typical size | Notes |
|------|----------------|-------|
| `StoreLogo.png` | 50×50 | Package logo in manifest Properties |
| `Square44x44Logo.png` | 44×44 | App list / taskbar small |
| `Square71x71Logo.png` | 71×71 | Medium tile variant |
| `Square150x150Logo.png` | 150×150 | Medium tile |
| `Square310x310Logo.png` | 310×310 | Large tile |
| `Wide310x150Logo.png` | 310×150 | Wide tile |
| `SplashScreen.png` | 620×300 | Splash |

`Package.appxmanifest` already references these paths. Visual Studio may warn until real assets are provided.

## Partner Center screenshots (not in this folder)

Upload desktop screenshots (≥1366×768) that show:

1. Crash Analyzer with honest Event Log findings  
2. Startup Manager (or Pro unlock screen — never fake cleanup scores)

See `docs/STORE-SUBMISSION.md`.
