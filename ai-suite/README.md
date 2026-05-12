## isendai (Next.js + Tailwind)

Production-ready AI tools suite with:

- Guest + member flows (magic link, Google, Facebook, other OAuth)
- Membership profile capture after first sign-in (`/account/profile`)
- Credits (1 request = 1 credit) with history and saved versions
- Multiple AI providers (OpenAI / Anthropic / Groq / DeepSeek / Google)
- In-app generation first; **Stripe checkout is deferred** (Faz 5)

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

3. Run:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Routes (high level)

| Path | Purpose |
|------|---------|
| `/` | Home + tools; shows live **credits snapshot** when Supabase is configured |
| `/login` | Email, Google, Facebook, other OAuth; redirects through `/auth/callback` |
| `/account/profile` | Membership / profile metadata (required until completed) |
| `/claim` | Merge **guest** credits + history on this device into the signed-in user |
| `/history` | Guest or signed-in request list |
| `/account` | Account, credits, recent requests |
| `/request/[id]` | Stored input + versions |
| `/pricing` | Reference tiers + **dev top-up** instructions (non-production) |
| `/terms`, `/privacy` | Legal (shell localized; body English) |
| `/success` | Generation step after saving tool input (uses credits, not Stripe redirect) |

## API

- `POST /api/generate` — scope check, **rate limit** (`ISENDAI_GENERATE_RPM`), charge 1 credit, generate v1
- `POST /api/isendai/request/version` — add alternate version (**rate limit** `ISENDAI_VERSION_RPM`)
- `POST /api/dev/topup` — add credits (**disabled in production**)

## Credits & growth (no Stripe yet)

- Default balances come from your Supabase rows (often `0` until topped up).
- **Non-production:** use `POST /api/dev/topup` as documented on `/pricing`.
- **Production:** grant credits via SQL, a future admin tool, or Stripe webhooks (planned).

### Planned pricing (see `/pricing`)

**Monthly bundles (USD)**

| Price   | Requests / month |
|---------|------------------|
| $7.99   | 500              |
| $9.99   | 1,000            |
| $19.99  | 5,000            |

**Custom monthly mix (estimated total)** — per-request rates aligned with those bundles (`src/lib/pricing-rates.ts`):

- Low / budget AI: `$19.99 / 5000`
- Mid / standard AI: `$9.99 / 1000`
- High / premium AI: `$7.99 / 500`

**Pay-as-you-go 10-request packs**

- **$1** — 10 credits; **budget-tier models only** (`salesPriceForModel` → `$1.00` band).
- **$1.49** — 10 credits; **budget + standard** (`$1.49` band).
- **$1.99** — 10 credits; **full catalog** (`$1.99` band).

Each generation consumes **1 credit**. Stripe checkout and entitlement enforcement are not wired yet; model price bands today match `src/models/models.ts` (`salesPriceForModel` / `modelSalesTier`).

## Learn more

- [Next.js Documentation](https://nextjs.org/docs)
