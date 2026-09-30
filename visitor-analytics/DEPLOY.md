# SitePulse production deploy (min-cost)

**Brand:** SitePulse placeholder (name/domain deferred).  
**Primary stack:** **Supabase Postgres** + **Netlify** (new site).  
**Do not** deploy this app via the monorepo’s existing Netlify sites (`moduluscursor`, `isendai`, root `netlify.toml`). Create a **separate** Netlify site with base directory `visitor-analytics/`.

## Architecture (day-1, $0)

| Piece | Choice |
| --- | --- |
| App host | **Netlify** free — **new** site, base `visitor-analytics/`, Official Next.js runtime (`@netlify/plugin-nextjs`) |
| Database | **Supabase** free Postgres + pooled `DATABASE_URL` (+ direct URL for Prisma migrate/push) |
| CDN | Netlify |
| Billing | Lemon Squeezy MoR — see store doc `docs/lemon-squeezy-setup.md` |

Optional alternative: **Vercel** Hobby — see [§ Alternative: Vercel](#alternative-vercel-optional) at the bottom.

---

## Exact clicks — Barbaros checklist

### A. Supabase (Postgres)

1. Open [supabase.com/dashboard](https://supabase.com/dashboard) → sign in (existing account).
2. **New project** → pick org → name e.g. `sitepulse` → set DB password → region (one primary; changing later = migration).
3. Wait until project is **Healthy**.
4. **Project Settings → Database → Connection string**.
5. Copy **two** URLs (URI mode):

| Use | Mode | Port | Prisma |
| --- | --- | --- | --- |
| **Runtime** (`DATABASE_URL`) | **Transaction** pooler | **6543** | Add `?pgbouncer=true` (and usually `sslmode=require`) |
| **Migrate / `db push`** (`DIRECT_URL`) | **Direct** (or Session mode on 5432) | **5432** | No `pgbouncer` — needed for Prisma migrations |

Example shapes (not real secrets):

```bash
# App + Netlify runtime (pooled / transaction)
DATABASE_URL="postgresql://postgres.PROJECTREF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"

# Local prisma db push / migrate (direct)
DIRECT_URL="postgresql://postgres.PROJECTREF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres?sslmode=require"
# Or Connect → Direct connection:
# DIRECT_URL="postgresql://postgres:PASSWORD@db.PROJECTREF.supabase.co:5432/postgres?sslmode=require"
```

6. Keep both secret — never commit.

**Prisma gotcha:** PgBouncer transaction mode does not support some Prisma migrate features. Always run `npx prisma db push` / `migrate` against `DIRECT_URL`. Schema uses `url` = pooled + `directUrl` = direct so `prisma db push` picks the direct connection automatically when both env vars are set.

### B. Schema push (once, from your machine)

```bash
cd visitor-analytics
cp .env.example .env
# Edit .env: DATABASE_URL (pooler), DIRECT_URL (direct), AUTH_SECRET, NEXT_PUBLIC_APP_URL
npm install
npm run db:validate-push   # checks env shape, then prisma db push (needs both URLs)
# Or: npx prisma db push
npm run db:seed   # optional demo users; skip for a clean prod DB
```

Copy-paste UI checklist + env template (Project store): `docs/launch-checklist.md`.

Generate `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

### C. Netlify (new site — not moduluscursor / isendai)

1. Open [app.netlify.com](https://app.netlify.com) → sign in (existing account).
2. **Add new site → Import an existing project** → connect GitHub → select **`barbarosson/project`**.
3. **Site configuration (critical):**
   - **Base directory:** `visitor-analytics`  
     (forces Netlify to use `visitor-analytics/netlify.toml` — **not** the repo-root Netlify config used by other apps)
   - **Build command:** `npm run build` (already in `netlify.toml`; leave as-is)
   - **Publish directory:** `.next` (plugin-managed; leave as in `netlify.toml`)
4. Confirm the site picks up **`@netlify/plugin-nextjs`** (Official Next.js Runtime) from `visitor-analytics/netlify.toml`.
5. **Site configuration → Environment variables → Add a variable** (scope: Production; add Preview too if you use Deploy Previews):

| Variable | Required | Value |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Supabase **pooled** URI (`:6543` + `?pgbouncer=true`) |
| `DIRECT_URL` | Recommended | Supabase **direct** URI (`:5432`) — required if build/CI ever runs `prisma db push` / migrate; safe to set same as local |
| `AUTH_SECRET` | Yes | ≥32 random chars (`openssl rand -base64 32`) |
| `NEXT_PUBLIC_APP_URL` | Yes | Final public origin, **no trailing slash** (set after first deploy URL is known) |
| `LEMONSQUEEZY_API_KEY` | Launch | From LS Settings → API |
| `LEMONSQUEEZY_STORE_ID` | Launch | Numeric store id |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | Launch | Webhook signing secret |
| `LEMONSQUEEZY_VARIANT_STARTER` | Launch | Variant id for $29 plan |
| `LEMONSQUEEZY_VARIANT_AGENCY` | Launch | Variant id for $79 plan |
| `LEMONSQUEEZY_VARIANT_SCALE` | Launch | Variant id for $199 plan |

You can skip all `LEMONSQUEEZY_*` on first boot — checkout stays stubbed until set.

6. **Deploy site** (trigger deploy / push to the linked branch).
7. Copy the site URL (`https://SOMETHING.netlify.app`) → set `NEXT_PUBLIC_APP_URL` to that origin → **trigger a redeploy** so invite links + Lemon Squeezy redirect match.
8. Lemon Squeezy webhook callback:

```text
{NEXT_PUBLIC_APP_URL}/api/webhooks/lemonsqueezy
```

### Monorepo warning

- **Never** point an existing monorepo Netlify site (moduluscursor / isendai) at `visitor-analytics`.
- **Never** clear Base directory to `/` for this SitePulse site — that builds the wrong app.
- Root `netlify.toml` must stay untouched for other products.

---

## Post-deploy smoke

1. Open `/` and `/pricing`.
2. Register a user (or use seed creds if seeded).
3. Create a site → copy snippet → hit `/api/ingest` or load a test page.
4. Billing page shows stub until LS env vars are set; after LS setup, Checkout should redirect to Lemon Squeezy.

## What Barbaros must do manually

- Supabase project + copy pooled + direct connection strings
- Netlify **new** site with base `visitor-analytics` + env vars in UI
- Generate/set `AUTH_SECRET`
- Set `NEXT_PUBLIC_APP_URL` after first URL is known, then redeploy
- Lemon Squeezy store + products + webhook (see lemon-squeezy-setup doc)
- Custom domain / DNS when name is chosen (deferred)
- Optional: Netlify scheduled function or external cron for `npm run retention:purge`

## Prisma / Netlify gotchas

| Issue | Fix |
| --- | --- |
| `prisma db push` / migrate fails on pooler | Use `DIRECT_URL` (port 5432, no `pgbouncer=true`). Schema `directUrl` makes Prisma use it for migrations. |
| Runtime exhausts connections | Keep Netlify `DATABASE_URL` on **Transaction** pooler (`:6543` + `?pgbouncer=true`). |
| Prisma engine missing on Lambda | `binaryTargets` includes `rhel-openssl-3.0.x` (Netlify Functions / AWS Lambda). `postinstall` / `build` run `prisma generate`. |
| Wrong app builds | Base directory must be `visitor-analytics`; do not reuse other Netlify sites. |
| App Router SSR/API quirks | Rely on Official Next runtime (`@netlify/plugin-nextjs` in this folder’s `netlify.toml`) — do not publish a static-only export. |
| `NEXT_PUBLIC_*` changed | Must **redeploy** after changing public env vars. |

## Offline SQLite (dev only)

Schema is **postgresql** for production. For air-gapped SQLite demos only:

1. In `prisma/schema.prisma`, set `provider = "sqlite"` and temporarily drop `directUrl` / unused `binaryTargets`.
2. `DATABASE_URL="file:./dev.db"`
3. `npx prisma db push && npm run db:seed`

Do **not** deploy SQLite to Netlify.

---

## Alternative: Vercel (optional)

If you prefer Vercel instead of Netlify:

1. [vercel.com/new](https://vercel.com/new) → Import `barbarosson/project` → **Root Directory:** `visitor-analytics`.
2. Set the same env vars (`DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, `LEMONSQUEEZY_*`).
3. Deploy (`npx vercel --prod` from `visitor-analytics/`, or Dashboard).  
   `vercel.json` remains for that path; **primary** production path is Netlify + Supabase above.
