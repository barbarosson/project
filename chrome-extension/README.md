# isendai Chrome Extension (Manifest V3)

Official browser extension for [isendai.com](https://isendai.com). Fix Gmail, LinkedIn, and X messages using your isendai account and credits.

## Install (development)

1. Sign in at **https://isendai.com/login** in Chrome (same profile as the extension).
2. Open `chrome://extensions` → **Developer mode** → **Load unpacked**.
3. Select this folder: `chrome-extension/`.

## Auth model

The extension does **not** store passwords. It reuses your existing **isendai.com session cookies** (Supabase) via the `cookies` permission and calls:

- `GET /api/me/wallet` — credits balance
- `POST /api/generate` — message generation (`corporate-whisperer` tool by default)

You must be logged in on isendai.com in the same Chrome profile.

## API base URL

Edit `lib/config.js` → `API_ENV`:

- `"production"` → `https://isendai.com`
- `"staging"` → `https://isendai.netlify.app`

## Features

| Feature | Description |
|--------|-------------|
| **Popup** | Generate tab + Account tab (credits, top-up link) |
| **Context menu** | Select text → right-click → **Fix with isendai** |
| **In-page panel** | Quick result overlay on supported sites |

## Chrome Web Store checklist

- [ ] Replace placeholder icons in `icons/` with final 16/48/128 PNGs
- [ ] Privacy policy URL on listing (describe cookie-based auth + API calls to isendai.com only)
- [ ] Screenshots + single purpose description
- [ ] Test on Gmail, LinkedIn, X after login

## File map

```
chrome-extension/
  manifest.json      # MV3 manifest
  background.js      # Service worker: menus, API proxy
  popup.html/js      # Main UI
  content.js/css     # In-page quick-fix panel
  lib/               # config, auth, api helpers
  icons/             # Extension icons
```

## Security notes

- Requests go only to configured isendai origins (see `host_permissions`).
- No arbitrary script injection on third-party pages beyond the isolated content UI.
- Session cookies are read only for isendai domains, never exfiltrated to third parties.
