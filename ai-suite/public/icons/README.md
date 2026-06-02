# PWA icons

Add branded install icons here (required for “Add to Home Screen” / Play Store–style install prompts):

| File | Size | Used by |
|------|------|---------|
| `icon-192x192.png` | 192×192 | `manifest.json`, Android install |
| `icon-512x512.png` | 512×512 | `manifest.json`, splash / high-DPI |

Paths are referenced in `public/manifest.json` as `/icons/icon-192x192.png` and `/icons/icon-512x512.png`.

Until final brand assets exist, run from `ai-suite/`:

```bash
node scripts/generate-pwa-icons.mjs
```

That resizes `src/app/favicon.ico` into placeholder PNGs so installs work in dev/staging.

**Design tips:** square PNG, safe zone for maskable (Android), dark background `#09090b` to match the app shell.
