# PWA icons

Add branded install icons here (required for “Add to Home Screen” / Play Store–style install prompts):

| File | Size | Used by |
|------|------|---------|
| `icon-192x192.png` | 192×192 | `manifest.json`, Android install |
| `icon-512x512.png` | 512×512 | `manifest.json`, splash / high-DPI |

Paths are referenced in `public/manifest.json` as `/icons/icon-192x192.png` and `/icons/icon-512x512.png`.

Master marks:

| File | Use |
|------|-----|
| `isendai-mark.svg` | Dark shell (`#09090b`) — PWA PNG source |
| `isendai-mark-light.svg` | Light shell (`#e8eaef`) — previews / docs |

Regenerate PNGs from `ai-suite/`:

```bash
node scripts/generate-pwa-icons.mjs
```

Uses `public/icons/isendai-mark.svg` → `icon-192x192.png` and `icon-512x512.png`.

Browser tab icon: `src/app/icon.svg` (Next.js App Router).

**Design tips:** square PNG, safe zone for maskable (Android), dark background `#09090b` to match the app shell.
