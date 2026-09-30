# SitePulse (M1 + M2)

Privacy-honest website analytics — **placeholder brand** (rename later).  
Isolated greenfield app under `visitor-analytics/` (does not mix with the root ERP/CMS in this monorepo).

## What is included

### M1
- First-party tracking snippet (`/t.js`) — pageviews + session
- Per-site identity: **first-party cookie** or **cookieless**
- Ingest API with site-key validation
- Email/password auth (JWT cookie; no paid auth vendor)
- Multi-tenant orgs → sites → public API keys
- Dashboard: sites list, 30d trends, top pages, recent visitors
- Privacy fields: IP truncate default on, retentionDays default 90
- English-only UI

### M2
- URL conversion goals (exact / prefix path)
- Custom event conversions via `sitepulse.track('event_name')`
- Conversion counts + 7d / 30d trends, by-goal + UTM breakdown
- Funnel v1 (2–5 ordered URL/event steps) with session drop-off rates
- UTM captured on ingest and copied onto conversion records

## Deferred (later milestones)

- Visitor stream, client RBAC, quotas
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

Seeded goals: **Thank-you page** (`/thanks`) + **Signup complete** (`signup_complete`).  
Seeded funnel: **Pricing → Contact → Thanks** (`/` → `/pricing` → `/thanks`).

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

Custom event (for event conversion goals):

```js
sitepulse.track('signup_complete');
// or
sitepulse.event('signup_complete');
sitepulse.pageview(); // force pageview
```

- Snippet fetches `/api/config?k=KEY` for `identityMode`
- Cookie mode sets `_sp_vid` / `_sp_sid` first-party cookies
- Cookieless: memory session on client; visitor hash from truncated IP + UA + day on server
- Pageviews + events POST to `/api/ingest` (UTM parsed from `url`)

## How to test conversions

1. `npm run db:setup && npm run dev`
2. Log in with demo credentials → open **Demo Site**
3. Confirm seeded conversion stats / funnel drop-off on the site page
4. Live ingest URL goal:
   ```bash
   curl -X POST http://localhost:3000/api/ingest \
     -H 'Content-Type: application/json' \
     -d '{"k":"sp_demo_site_key_0001","type":"pageview","path":"/thanks","url":"https://demo.example.com/thanks?utm_source=test","visitorId":"v1","sessionId":"s-new-1"}'
   ```
5. Live ingest event goal:
   ```bash
   curl -X POST http://localhost:3000/api/ingest \
     -H 'Content-Type: application/json' \
     -d '{"k":"sp_demo_site_key_0001","type":"event","eventName":"signup_complete","path":"/signup","url":"https://demo.example.com/signup?utm_source=ads","visitorId":"v2","sessionId":"s-new-2"}'
   ```
6. Refresh the site dashboard — counts, trends, and UTM breakdown update

## Scripts

| Script | |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run db:setup` | `prisma db push` + seed |
| `npm run db:seed` | Re-seed demo data |

## API

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/api/auth/register` | public |
| POST | `/api/auth/login` | public |
| POST | `/api/auth/logout` | session |
| GET | `/api/config?k=` | public (snippet) |
| POST | `/api/ingest` | site key (`pageview` \| `event`) |
| GET/POST | `/api/sites` | session |
| GET/PATCH | `/api/sites/:id` | session |
| GET/POST | `/api/sites/:id/goals` | session |
| PATCH/DELETE | `/api/sites/:id/goals/:goalId` | session |
| GET | `/api/sites/:id/conversions?days=7\|30` | session |
| GET/POST | `/api/sites/:id/funnels` | session |
| GET/DELETE | `/api/sites/:id/funnels/:funnelId` | session |
