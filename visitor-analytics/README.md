# SitePulse (M1–M4)

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

### M3
- **Visitor stream** — near-realtime sessions/events (client poll ~8–10s)
- **Client invite / RBAC** — owner invites client email; read-only access to selected sites
- **Quota** — plan PV/month counter; soft warning UI; hard reject at ingest (HTTP 429)
- **Lemon Squeezy MoR skeleton** — checkout + webhook entitlement; stubs when keys absent
- Portfolio UX — site cards with 7d PV/conversions

### M4
- **`requireConsent`** site setting — snippet waits for `sitepulse.consent(true)`
- Public **Pricing** (`/pricing`) — Starter $29 / Agency $79 / Scale $199 → MoR checkout stub
- **Docs** — install, events, conversions/funnels, DPA outline
- **Privacy / Terms / DPA** stub pages (privacy-honest; no “no personal data”)
- **Retention purge** script: `npm run retention:purge` ([`--dry-run`](scripts/retention-purge.ts))
- Quota **in-app banner at 90%** (email skipped — no provider)
- **CSV export** for pageviews / conversions (30d)
- Polished marketing landing `/`

## Deferred / launch gaps

- Live Lemon Squeezy store + keys, production domain, counsel-reviewed legal
- Invite email delivery, geo IP, automated retention cron, ClickHouse
- Replay/heatmap, org enrichment, AppSumo LTD (banned)

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind
- Prisma + **SQLite** for zero-cost local demo
- Production: Postgres (Neon/Supabase) + Vercel/Railway free tier
- Billing MoR: **Lemon Squeezy** (chosen for simpler TR şahıs / global MoR path vs self Stripe Tax)

## Local setup

```bash
cd visitor-analytics
cp .env.example .env
npm install
npm run db:setup
npm run dev
```

Open http://localhost:3000

### Demo credentials

| Role | Email | Password |
| --- | --- | --- |
| Owner | `demo@sitepulse.dev` | `demo1234` |
| Client (Demo Site only) | `client@sitepulse.dev` | `client1234` |

| | |
| --- | --- |
| Demo site key | `sp_demo_site_key_0001` |
| Cookieless key | `sp_demo_cookieless_0002` |
| Pending invite | `/invite/sp_demo_invite_token_0001` |

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | SQLite `file:./dev.db` or Postgres URL |
| `AUTH_SECRET` | JWT signing secret (16+ chars) |
| `NEXT_PUBLIC_APP_URL` | Public origin (snippet + invite links) |
| `LEMONSQUEEZY_API_KEY` | Optional — MoR API |
| `LEMONSQUEEZY_STORE_ID` | Optional — store id |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | Optional — webhook HMAC |
| `LEMONSQUEEZY_VARIANT_STARTER` | Optional — variant id |
| `LEMONSQUEEZY_VARIANT_AGENCY` | Optional — variant id |
| `LEMONSQUEEZY_VARIANT_SCALE` | Optional — variant id |

App **builds and runs without** Lemon Squeezy keys. Checkout returns a stub message; webhook accepts local stub posts with `X-SitePulse-Stub: 1` when secret is unset.

### Postgres (Neon / Supabase)

1. Create a free Postgres database.
2. Set `DATABASE_URL` to the Postgres URL.
3. In `prisma/schema.prisma`, change `provider = "sqlite"` to `provider = "postgresql"`.
4. Run `npx prisma db push` then `npm run db:seed`.

## Install the tracking snippet

```html
<script defer src="http://localhost:3000/t.js" data-site="YOUR_SITE_KEY"></script>
```

```js
sitepulse.track('signup_complete');
```

## How to test visitor stream

1. `npm run db:setup && npm run dev`
2. Log in as owner → **Stream** (or Portfolio embeds a stream)
3. In another terminal, send events:
   ```bash
   curl -X POST http://localhost:3000/api/ingest \
     -H 'Content-Type: application/json' \
     -d '{"k":"sp_demo_site_key_0001","type":"pageview","path":"/live","url":"https://demo.example.com/live","visitorId":"v-live","sessionId":"s-live-1"}'
   ```
4. Within ~10s the stream panel updates (no websocket)

## How to test client invite

1. As owner → **Team** → invite email + select sites → copy accept link  
   Or open seeded pending invite: http://localhost:3000/invite/sp_demo_invite_token_0001
2. Accept with name + password → lands on Portfolio (client role)
3. Client sees only allowed sites; cannot add sites / edit goals / settings
4. Or log in as seeded client: `client@sitepulse.dev` / `client1234`

## Quota & MoR stub

- Plans: Dev (1M PV, default), Starter 50k / Agency 300k / Scale 2M
- Soft warning at **90%** usage (in-app banner; no email); hard limit returns `429` on pageview ingest
- Billing page: stub checkout without LS keys
- Webhook stub test (no secret configured):
  ```bash
  # Replace ORG_ID from seed log / Team page context
  curl -X POST http://localhost:3000/api/webhooks/lemonsqueezy \
    -H 'Content-Type: application/json' \
    -H 'X-SitePulse-Stub: 1' \
    -d '{"meta":{"event_name":"stub_subscription_created","custom_data":{"org_id":"ORG_ID","plan":"agency"}},"data":{"id":"sub_stub","attributes":{"customer_id":"1","status":"active"}}}'
  ```

## Scripts

| Script | |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run db:setup` | `prisma db push` + seed |
| `npm run db:seed` | Re-seed demo data |
| `npm run retention:purge` | Delete events past site retention (`-- --dry-run` OK) |

## API (M3 additions)

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/api/stream?siteId=&since=&limit=` | session |
| GET/POST | `/api/org/invites` | owner/admin |
| DELETE | `/api/org/invites/:id` | owner/admin |
| GET/POST | `/api/invites/accept` | public (token) |
| GET/POST | `/api/org/billing` | session / manage |
| POST | `/api/webhooks/lemonsqueezy` | signature or stub header |
| GET | `/api/sites/:id/export?type=pageviews\|conversions` | session |

## Public pages (M4)

| Path | |
| --- | --- |
| `/` | Marketing landing |
| `/pricing` | Plans + MoR CTA |
| `/docs` … | Install, events, conversions, DPA outline |
| `/privacy` `/terms` `/dpa` | Legal stubs |

## Retention

```bash
npm run retention:purge -- --dry-run
npm run retention:purge
```

Deletes events/conversions older than each site’s `retentionDays` (default 90).
