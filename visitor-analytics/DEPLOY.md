# SitePulse production deploy (min-cost)

**Brand:** SitePulse placeholder (name/domain deferred).  
**Do not** deploy this app via the monorepo’s moduluscursor Netlify project. Create a **separate** Vercel project rooted at `visitor-analytics/`.

## Architecture (day-1, $0)

| Piece | Choice |
| --- | --- |
| App host | **Vercel** Hobby (free) — project root `visitor-analytics/` |
| Database | **Neon** free Postgres + `DATABASE_URL` |
| CDN | Vercel edge (Cloudflare optional later for custom domain) |
| Billing | Lemon Squeezy MoR — see store doc `docs/lemon-squeezy-setup.md` |

## 1. Neon Postgres

1. Sign up at [neon.tech](https://neon.tech) (free tier).
2. Create a project (pick **one** primary region; EU-West or US-East — decide later is fine; change costs a migration).
3. Copy the **connection string** (pooled or direct). Prefer the **pooled** URL for serverless (`?sslmode=require`).
4. Keep it secret — never commit it.

Example shape (not a real secret):

```bash
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxxx.REGION.aws.neon.tech/neondb?sslmode=require"
```

## 2. Push schema + seed (once, from your machine)

```bash
cd visitor-analytics
cp .env.example .env
# Edit .env: set DATABASE_URL (Neon), AUTH_SECRET (32+ random chars), NEXT_PUBLIC_APP_URL
npm install
npx prisma db push
npm run db:seed   # optional demo users; skip for a clean prod DB
```

Generate `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

## 3. Vercel project (own project — not Netlify)

### Option A — CLI (recommended)

```bash
# One-time: npm i -g vercel   OR use npx
cd visitor-analytics
npx vercel login

# Link / create project. When asked for root, this folder IS the app root.
# From monorepo clone instead:
#   npx vercel --cwd visitor-analytics
npx vercel link
```

Set env vars (Production + Preview):

```bash
npx vercel env add DATABASE_URL production
npx vercel env add AUTH_SECRET production
npx vercel env add NEXT_PUBLIC_APP_URL production
# Lemon Squeezy placeholders until store is live (optional for first boot):
npx vercel env add LEMONSQUEEZY_API_KEY production
npx vercel env add LEMONSQUEEZY_STORE_ID production
npx vercel env add LEMONSQUEEZY_WEBHOOK_SECRET production
npx vercel env add LEMONSQUEEZY_VARIANT_STARTER production
npx vercel env add LEMONSQUEEZY_VARIANT_AGENCY production
npx vercel env add LEMONSQUEEZY_VARIANT_SCALE production
```

For empty LS values during first deploy, you can skip the `LEMONSQUEEZY_*` vars — checkout stays stubbed until they are set.

Deploy:

```bash
npx vercel --prod
```

After deploy, set `NEXT_PUBLIC_APP_URL` to the real `https://YOUR-PROJECT.vercel.app` (or custom domain) and redeploy so invite links + LS redirect match.

### Option B — Vercel Dashboard

1. [vercel.com/new](https://vercel.com/new) → Import `barbarosson/project`.
2. **Root Directory:** `visitor-analytics` (critical).
3. Framework: Next.js (auto).
4. Add the env vars listed above.
5. Deploy.

### Monorepo warning

If Root Directory is `/` (repo root), Vercel will try to build the ERP/CMS (`moduluscursor` / `isendaiprod` noise). Always set root to `visitor-analytics`.

## 4. Env checklist

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Neon Postgres URL |
| `AUTH_SECRET` | Yes | ≥32 random chars |
| `NEXT_PUBLIC_APP_URL` | Yes | Final public origin, no trailing slash |
| `LEMONSQUEEZY_API_KEY` | Launch | From LS Settings → API |
| `LEMONSQUEEZY_STORE_ID` | Launch | Numeric store id |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | Launch | Signing secret from webhook |
| `LEMONSQUEEZY_VARIANT_STARTER` | Launch | Variant id for $29 plan |
| `LEMONSQUEEZY_VARIANT_AGENCY` | Launch | Variant id for $79 plan |
| `LEMONSQUEEZY_VARIANT_SCALE` | Launch | Variant id for $199 plan |

Webhook URL after deploy:

```text
{NEXT_PUBLIC_APP_URL}/api/webhooks/lemonsqueezy
```

## 5. Post-deploy smoke

1. Open `/` and `/pricing`.
2. Register a user (or use seed creds if seeded).
3. Create a site → copy snippet → hit `/api/ingest` or load a test page.
4. Billing page shows stub until LS env vars are set; after LS setup, Checkout should redirect to Lemon Squeezy.

## 6. What Barbaros must do manually

- Neon account + project + copy `DATABASE_URL`
- Vercel account + create project (or `vercel login` + token)
- Generate/set `AUTH_SECRET`
- Set `NEXT_PUBLIC_APP_URL` after first URL is known
- Lemon Squeezy store + products + webhook (see lemon-squeezy-setup doc)
- Custom domain / DNS when name is chosen (deferred)
- Optional: Vercel cron or external cron for `npm run retention:purge`

## Offline SQLite (dev only)

Schema is **postgresql** for production. For air-gapped SQLite demos only:

1. In `prisma/schema.prisma`, set `provider = "sqlite"` and remove or ignore `binaryTargets` if unused.
2. `DATABASE_URL="file:./dev.db"`
3. `npx prisma db push && npm run db:seed`

Do **not** deploy SQLite to Vercel.
