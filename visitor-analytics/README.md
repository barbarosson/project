# SitePulse (M1)

Privacy-honest website analytics — **placeholder brand** (rename later).  
Isolated greenfield app under `visitor-analytics/` (does not mix with the root ERP/CMS in this monorepo).

## What M1 includes

- First-party tracking snippet (`/t.js`) — pageviews + session
- Per-site identity: **first-party cookie** or **cookieless**
- Ingest API with site-key validation
- Email/password auth (JWT cookie; no paid auth vendor)
- Multi-tenant orgs → sites → public API keys
- Dashboard: sites list, 30d trends, top pages, recent visitors
- Privacy fields: IP truncate default on, retentionDays default 90
- English-only UI

## Deferred (later milestones)

- Conversions / funnels, visitor stream, client RBAC, quotas
- MoR billing (Paddle/Lemon Squeezy), geo IP country lookup
- Retention purge cron (field exists; job not wired)
- ClickHouse, replay/heatmap, org enrichment

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind
- Prisma + **SQLite** for zero-cost local demo
- Production: switch `provider` to `postgresql` + Neon/Supabase free tier; deploy on Vercel/Railway free tier

## Local setup

```bash
cd visitor-analytics
cp .env.example .env
npm install
npm run db:setup    # migrate schema + seed demo data
npm run dev
```

Open http://localhost:3000

### Demo credentials (from seed)

| | |
| --- | --- |
| Email | `demo@sitepulse.dev` |
| Password | `demo1234` |
| Demo site key | `sp_demo_site_key_0001` |
| Cookieless key | `sp_demo_cookieless_0002` |

### Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | SQLite `file:./dev.db` or Postgres connection string |
| `AUTH_SECRET` | JWT signing secret (16+ chars) |
| `NEXT_PUBLIC_APP_URL` | Public origin for snippet install URLs |

### Postgres (Neon / Supabase)

1. Create a free Postgres database.
2. Set `DATABASE_URL` to the Postgres URL.
3. In `prisma/schema.prisma`, change `provider = "sqlite"` to `provider = "postgresql"`.
4. Run `npx prisma migrate dev --name init` (or `db push`) then `npm run db:seed`.

## Install the tracking snippet

```html
<script defer src="http://localhost:3000/t.js" data-site="YOUR_SITE_KEY"></script>
```

- Snippet fetches `/api/config?k=KEY` for `identityMode`
- Cookie mode sets `_sp_vid` / `_sp_sid` first-party cookies
- Cookieless: memory session on client; visitor hash from truncated IP + UA + day on server
- Events POST to `/api/ingest`

## Scripts

| Script | |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run db:setup` | `prisma db push` + seed |
| `npm run db:seed` | Re-seed demo data |

## API (M1)

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/api/auth/register` | public |
| POST | `/api/auth/login` | public |
| POST | `/api/auth/logout` | session |
| GET | `/api/config?k=` | public (snippet) |
| POST | `/api/ingest` | site key |
| GET/POST | `/api/sites` | session |
| GET/PATCH | `/api/sites/:id` | session |
