# SitePulse (M1–M4 + top 5 features)

Privacy-honest website analytics — **placeholder brand** (rename later).  
Isolated greenfield app under `visitor-analytics/` (does not mix with the root ERP/CMS in this monorepo).

## What is included

### M1–M4 (shipped)
- First-party tracking snippet (`/t.js`) — pageviews + session
- Per-site identity: **first-party cookie** or **cookieless**
- Ingest API, auth, multi-tenant orgs, dashboard, conversions/funnels
- Visitor stream, client invite RBAC, quotas, Lemon Squeezy MoR skeleton
- Consent gate, pricing/docs/privacy/DPA, CSV export, retention purge

### Top 5 features (this branch — draft PR; not merged / not deployed)
1. **Shared dashboard link** — read-only `/share/[token]` for a site or org portfolio; optional password; create/revoke in UI; token in DB
2. **Weekly email digest + quota/spike alerts** — digest generation, in-app **Alerts**, optional outbound via `RESEND_API_KEY` (or SMTP stub); cron script `npm run digest:weekly`
3. **First-touch / journey panel** — session path first touch → pages → conversion; privacy-honest (no company/person reveal)
4. **First-party script proxy** — `/docs/proxy`, `/api/script`, Next/Netlify rewrite examples under `public/examples/`
5. **White-label client portal** — org logo URL + display name on client invite, client nav, and shared links

## Deferred / launch gaps

- Live Lemon Squeezy keys, counsel-reviewed legal
- Custom white-label domain (CNAME), paid email day-1, geo IP, ClickHouse
- Replay/heatmap, org enrichment, AppSumo LTD (banned)
- Final product name + `.com`

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind
- Prisma + **Supabase Postgres** — see [`DEPLOY.md`](./DEPLOY.md)
- Host: **Netlify** (base `visitor-analytics/`) — do not auto-deploy this feature branch to production
- Billing MoR: **Lemon Squeezy**

## Local setup

```bash
cd visitor-analytics
cp .env.example .env
# Set DATABASE_URL (Supabase pooler) + DIRECT_URL (direct) — see DEPLOY.md
npm install
npm run db:setup
npm run dev
```

Open http://localhost:3000

**Do not merge/deploy this feature branch to production Netlify** unless Barbaros explicitly asks. Draft PR only.

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
| Site share (no password) | `/share/sp_demo_share_token_0001` |
| Org share | `/share/sp_demo_share_org_0001` |

## Try each top-5 feature locally (no deploy)

### 1. Shared dashboard link
1. Login as owner → open **Demo Site** → **Shared dashboard link** (or Portfolio for org share).
2. Create a link (optional password + expiry) → copy URL → open in a private window.
3. Revoke from the same panel. Seeded: http://localhost:3000/share/sp_demo_share_token_0001

### 2. Weekly digest + quota/spike alerts
```bash
# Dry-run (print digest text only)
npm run digest:weekly -- --dry-run

# Write in-app notification (+ email stub unless RESEND_API_KEY set)
npm run digest:weekly -- --force

# Single org
npm run digest:weekly -- --org ORG_ID --force
```
Then open **Alerts** in the app nav. Quota warnings also fire when usage crosses soft/hard thresholds on ingest. Spike rule: today PV ≥ 7d daily avg × org `spikeMultiplier` (default 3; editable under Team branding).

### 3. Journey panel
Open **Demo Site** → **First-touch / journey**. Seeded funnel sessions show first-touch source → pages → conversion. Cookieless sites show best-effort copy (no fake org reveal).

### 4. First-party script proxy
- Docs: http://localhost:3000/docs/proxy  
- Endpoint: http://localhost:3000/api/script (same JS as `/t.js`)  
- Examples: `public/examples/nextjs-sp-proxy.config.js`, `public/examples/netlify-sp-proxy-_redirects`

### 5. White-label
1. **Team** → set display name + logo URL → Save.  
2. Open client login (`client@sitepulse.dev`) or invite / share pages — branding appears.  
Seed uses `Demo Agency Analytics` + favicon URL.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Supabase Transaction pooler |
| `DIRECT_URL` | Supabase direct (migrate / db push) |
| `AUTH_SECRET` | JWT signing secret |
| `NEXT_PUBLIC_APP_URL` | Public origin (snippet + share/invite links) |
| `LEMONSQUEEZY_*` | Optional MoR |
| `RESEND_API_KEY` / `RESEND_FROM` | Optional real digest/alert email |
| `SMTP_HOST` (+ related) | Optional; currently logged stub (prefer Resend) |

## Scripts

| Script | |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build (`prisma generate` + Next) |
| `npm run db:setup` | `prisma db push` + seed |
| `npm run digest:weekly` | Weekly digest + spike/quota checks |
| `npm run retention:purge` | Delete events past retention |

## Schema notes

New Prisma models/fields (compatible `db push`): `SharedLink`, `Notification`, org `brandLogoUrl` / `brandDisplayName` / digest & spike settings. After pull: `npm run db:validate-push` locally; **production Supabase must get the same push before Netlify deploy** or register/API writes can 500 — see [`DEPLOY.md` § After top 5 merge](./DEPLOY.md#after-top-5-merge-pr-10--run-db-push-on-supabase).

## API additions

| Method | Path | Auth |
| --- | --- | --- |
| GET/POST | `/api/org/shared-links` | owner/admin |
| DELETE | `/api/org/shared-links/:id` | owner/admin |
| GET/POST | `/api/share/:token` | public (password if set) |
| GET/PATCH | `/api/org/branding` | session / manage |
| GET/POST | `/api/org/notifications` | staff |
| GET | `/api/script` | public (tracker proxy) |

## Only you (Barbaros)

Agents cannot create your Supabase/Netlify/Lemon Squeezy accounts or paste secrets. **Source of truth:** [`DEPLOY.md` § Only you (Barbaros)](./DEPLOY.md#only-you-barbaros).

**This feature work ships as a draft PR only — do not merge to `main` and do not trigger Netlify production until you decide.**
