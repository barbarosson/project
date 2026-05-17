## isendai (Next.js + Tailwind)

Production-ready AI tools suite with:

- Guest + member flows (magic link, Google, Facebook, other OAuth)
- Membership profile capture after first sign-in (`/account/profile`)
- **Credits** — billed by **model tier × 500-character chunks** (rounded up); history and saved versions
- Multiple AI providers (OpenAI / Anthropic / Groq / DeepSeek / Google)
- **Lemon Squeezy** checkout + webhooks for packs (see `src/app/api/webhook/route.ts` and env vars)

## Supabase database

Apply the bundled migration so RPCs and tables exist:

- File: `supabase/migrations/20260512000000_isendai_core.sql`
- Overview: `docs/isendai-schema.md`

Without this migration, credit and history features will fail at runtime.

## Getting started

1. Create `ai-suite/.env.local` from the example:

```bash
copy .env.example .env.local
```

2. Fill at minimum:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `OPENAI_API_KEY` (or another provider you enable)
- **`NEXT_PUBLIC_SITE_URL`** — use your real deploy URL (e.g. `https://isendai.netlify.app`). Supabase puts this into password-reset and sign-up email links when set at **build** time; without it, links follow whatever origin you used when you clicked “Forgot password” (often `http://localhost:3000`).

**Supabase Dashboard → Authentication → URL Configuration:** set **Site URL** to the same production URL and add **`https://isendai.netlify.app/**`** (or your domain) under **Redirect URLs** so recovery links are accepted.

3. Run:

```bash
npm run dev
```

Open `http://localhost:3000`.

### Google (and other OAuth) sign-in

1. **Supabase** → Authentication → Providers → **Google**: enable, paste **Client ID** and **Client secret** from [Google Cloud Console](https://console.cloud.google.com/apis/credentials) (OAuth 2.0 Web client).
2. In Google Cloud → **Authorized redirect URIs**, add Supabase’s redirect URL exactly as shown in the Supabase Google provider panel (looks like `https://<project-ref>.supabase.co/auth/v1/callback`).
3. **Supabase** → Authentication → **URL Configuration**: set **Site URL** to your production origin; under **Redirect URLs** allow `https://your-domain/**/auth/callback` (and `http://localhost:3000/**` for local dev).
4. Set **`NEXT_PUBLIC_SITE_URL`** on the host (e.g. Netlify) to the same public HTTPS origin so `/login` builds the correct `redirectTo` for OAuth.

After Google returns to `/auth/callback`, the app exchanges the `code` for a session and redirects to `next` (default `/`).

### Facebook sign-in (Meta Developer)

1. Create an app at [Meta for Developers](https://developers.facebook.com/) → **My Apps** → **Create App** → use case **Other** / **Consumer** → add product **Facebook Login** → **Web**.
2. **Facebook Login** → **Settings** → **Valid OAuth Redirect URIs**: paste Supabase’s callback URL from **Authentication → Providers → Facebook** (e.g. `https://<project-ref>.supabase.co/auth/v1/callback`).
3. **Settings** → **Basic**: note **App ID** and **App Secret**; set **App domains** to `isendai.netlify.app` (and `localhost` only if Meta allows it for dev); add **Privacy Policy** and **Terms** URLs (required before going Live).
4. **Supabase** → Authentication → Providers → **Facebook**: enable, paste App ID + App Secret, save.
5. While the Meta app is in **Development** mode, only **Roles** testers/admins/devs can log in — add your Facebook account under **App roles** → **Administrators** or **Test users**, or switch the app **Live** after review.
6. Same **URL Configuration** and **`NEXT_PUBLIC_SITE_URL`** as Google (see above).

Flow: site → Facebook → Supabase callback → `/auth/callback` → home (or `next`).

### Instagram sign-in (Meta + Supabase custom OAuth)

Instagram is **not** the same as Facebook Login. Supabase has no built-in Instagram provider; the app uses **`custom:instagram`**.

**Limitations:** Only [Instagram professional accounts](https://help.instagram.com/502981923235522) (business/creator). Personal Instagram accounts cannot use this API. Instagram does **not** return email — enable **email optional** on the custom provider and users complete the membership profile after sign-in.

1. In the same [Meta app](https://developers.facebook.com/) (or a new one), add **Instagram** → **API setup with Instagram login** / Business login.
2. **Instagram** product → **Business login settings** → **OAuth redirect URIs**: Supabase callback  
   `https://<project-ref>.supabase.co/auth/v1/callback` (copy from any Auth provider page).
3. Note the **Instagram App ID** and **Instagram App Secret** (Dashboard → Instagram → API setup — not always the same as Facebook App ID).
4. **Supabase** → Authentication → Providers → **New provider** → Manual (OAuth2):
   - **Identifier:** `custom:instagram` (must match code)
   - **Authorization URL:** `https://api.instagram.com/oauth/authorize`
   - **Token URL:** `https://api.instagram.com/oauth/access_token`
   - **User Info URL:** `https://graph.instagram.com/me?fields=user_id,username,name,profile_picture_url`
   - **Scopes:** `instagram_business_basic`
   - **Email optional:** ON
   - Client ID / Secret: Instagram App ID + Secret from step 3
5. Enable the provider. Same **Redirect URLs** and **`NEXT_PUBLIC_SITE_URL`** as other OAuth.

Flow: site → Instagram authorize → Supabase callback → `/auth/callback` → membership profile if incomplete.

## Routes (high level)

| Path | Purpose |
|------|---------|
| `/` | Home + tools; shows live **credits snapshot** when Supabase is configured |
| `/login` | Email, Google, Facebook, Instagram (`custom:instagram`), other OAuth; redirects through `/auth/callback` |
| `/account/profile` | Membership / profile metadata (required until completed) |
| `/claim` | Merge **guest** credits + history on this device into the signed-in user |
| `/history` | Guest or signed-in request list |
| `/account` | Account, credits, recent requests |
| `/request/[id]` | Stored input + versions |
| `/pricing` | Reference tiers + **dev top-up** instructions (non-production) |
| `/terms`, `/privacy` | Legal (shell localized; body English) |
| `/success` | Generation step after saving tool input (uses credits from balance; chunk-based billing) |

## API

- `POST /api/generate` — scope check, **rate limit** (`ISENDAI_GENERATE_RPM`), **credit charge** from `creditsForGeneration(model, inputLength)`, generate v1
- `POST /api/isendai/request/version` — add alternate version (**rate limit** `ISENDAI_VERSION_RPM`)
- `POST /api/dev/topup` — add credits (**disabled in production**); optional `DEV_TOPUP_SECRET` + header `X-Dev-Topup-Secret` or `Authorization: Bearer`

## Credits & billing

- Generation cost = **chunks × per-chunk rate**, where **chunks = ceil(input chars / 500)** (see `src/models/models.ts`: `creditsForGeneration`, `billableChunks500`).
- **Economy** models + **GPT‑4o mini**: **1** credit per chunk; **Standard**: **15**; **Premium**: **25**.
- **Production:** Lemon Squeezy orders + webhooks grant credits; operators can also adjust via SQL.
- **Non-production:** use `POST /api/dev/topup` as documented on `/pricing`.

### Planned pricing (see `/pricing`)

**Monthly bundles (USD)**

| Price   | Credits / month |
|---------|-----------------|
| $7.99   | 500             |
| $9.99   | 1,000           |
| $19.99  | 5,000           |

**Pay-as-you-go packs**

- **$1** → **10 credits**; **budget-tier models only** (`salesPriceForModel` → `$1.00` band). ~**$0.10**/credit. **Economy models + GPT‑4o mini**: **0.2 credits per 100 characters** (rounded up).
- **$1.49** → **25 credits**; **budget + standard** (`$1.49` band). ~**$0.060**/credit. **Standard** models: **3 credits per 100 characters** (rounded up).
- **$1.99** → **50 credits**; **full catalog** (`$1.99` band). ~**$0.040**/credit. **Premium** models: **5 credits per 100 characters** (rounded up).

Balances and charges are stored in **tenths** (0.1 credit) in Postgres. After deploying, run migration `20260515180000_credit_balance_tenths.sql` once per environment.

Configure Lemon Squeezy keys and variant IDs in `.env.local`. See `src/models/models.ts` (`salesPriceForModel`, `PAYGO_PACK_CREDITS`, `creditsForGeneration`).

## Learn more

- [Next.js Documentation](https://nextjs.org/docs)
