# AppointFlow Setup — Modulus Edition

This document is the short list of things to do **once** to put
`/products/appointflow` into revenue. All the code is already shipped to
`main`; everything here is environment configuration.

---

## 0) Prerequisites you already have

- `modulusaas.com` deployed to Netlify from `main`
- Supabase project `itvrvouaxcutpetyzhvg` linked as the ERP database
- Lemon Squeezy merchant account (application approved)

---

## 1) Run the AppointFlow migrations against the ERP Supabase

There are three SQL migrations in `supabase/migrations/`:

| file | what it does |
| -- | -- |
| `20260417120000_create_apptflow_core.sql` | Creates the full `apptflow` schema (19 tables, triggers, RLS). |
| `20260417130000_apptflow_service_role_grants.sql` | Grants `service_role` access to the `apptflow` schema. |
| `20260418100000_apptflow_lemon_squeezy.sql` | Adds `lemon_subscription_id`, `lemon_customer_id`, `lemon_variant_id`, `lemon_order_id` columns on `apptflow.subscriptions`. |

Push them to the linked project:

```powershell
npx -y supabase@latest db push
```

> If you have not yet exposed the schema, go to **Supabase Dashboard → API
> Settings** and add `apptflow` to both "Exposed schemas" and "Extra search
> path". Without this, the PostgREST API will return
> `{"error":"Invalid schema: apptflow"}`.

---

## 2) Deploy the orchestrator Edge Function

```powershell
npx -y supabase@latest functions deploy apptflow-orchestrator --no-verify-jwt
```

Then set the shared secret the Next.js API uses to talk to it:

```powershell
npx -y supabase@latest secrets set APPTFLOW_WEBHOOK_SECRET=<a long random string>
```

Generate the value with:

```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
```

---

## 3) Create the three tiers in Lemon Squeezy

In your Lemon Squeezy store (dashboard → Products → **New product**),
create **3 subscription products**:

| Product name | Monthly price | Yearly price |
| -- | -- | -- |
| Modulus AppointFlow — Starter | $29 | $290 |
| Modulus AppointFlow — Pro     | $79 | $790 |
| Modulus AppointFlow — Business | $199 | $1990 |

For each product, create **two variants**: Monthly and Yearly. Enable the
**7-day free trial** on every variant (Product settings → Subscription).

After saving, copy the six numeric **variant IDs** (Lemon shows them in
the URL of the variant detail page, e.g.
`…/variants/12345`) — they go into env vars below.

---

## 4) Configure environment variables on Netlify

Copy `.env.example` → all the new keys and set them in Netlify (Site
Settings → Environment variables). The required set is:

```dotenv
# Supabase is already set — leave as is.
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# AppointFlow shared secrets
APPTFLOW_WEBHOOK_SECRET=<same value you set on Supabase in step 2>
APPTFLOW_CRON_SECRET=<another random 48-byte string>
APPTFLOW_PUBLIC_URL=https://modulusaas.com
APPTFLOW_DEFAULT_CURRENCY=USD
APPTFLOW_MIN_MARGIN=0.10
APPTFLOW_FX_PROVIDER_URL=https://open.er-api.com/v6/latest/USD

# Lemon Squeezy billing
LEMON_SQUEEZY_API_KEY=<Lemon → Settings → API>
LEMON_SQUEEZY_STORE_ID=<numeric store id from dashboard>
LEMON_SQUEEZY_WEBHOOK_SECRET=<random string, reused in step 5>
LEMON_VARIANT_STARTER_MONTHLY=<variant id from step 3>
LEMON_VARIANT_STARTER_YEARLY=
LEMON_VARIANT_PRO_MONTHLY=
LEMON_VARIANT_PRO_YEARLY=
LEMON_VARIANT_BUSINESS_MONTHLY=
LEMON_VARIANT_BUSINESS_YEARLY=

# WhatsApp Cloud API
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=

# Google Calendar OAuth
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=https://modulusaas.com/api/apptflow/calendar/google/callback

# OpenAI (the messaging agent uses this to understand WhatsApp messages)
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

Redeploy after saving — Netlify picks up env changes on the next build.

---

## 5) Register the Lemon Squeezy webhook

In Lemon Squeezy → **Settings → Webhooks → New webhook**:

- **URL**: `https://modulusaas.com/api/apptflow/webhooks/lemon`
- **Signing secret**: the same value you set as `LEMON_SQUEEZY_WEBHOOK_SECRET`
- **Events**: subscribe to **all** `subscription_*` events **and**
  `order_created`, `order_refunded`, `license_key_created`

Click **Send test webhook** — you should see a `200 OK` with
`{"ok": true, "event": "subscription_created", ...}` in the Lemon
delivery log.

---

## 6) Register the WhatsApp webhook

In Meta for Developers → your App → **WhatsApp → Configuration → Webhooks**:

- **Callback URL**: `https://modulusaas.com/api/apptflow/webhooks/whatsapp`
- **Verify token**: the value you set as `WHATSAPP_VERIFY_TOKEN`
- Subscribe to the `messages` event.

---

## 7) Set up cron jobs

AppointFlow relies on four idempotent cron endpoints. On Netlify, use
**Scheduled Functions**, or on Supabase use `pg_cron` to call each URL
with the `Authorization: Bearer <APPTFLOW_CRON_SECRET>` header.

| Endpoint | Schedule | What it does |
| -- | -- | -- |
| `POST /api/apptflow/cron/reminders` | every 5 min | Sends 24h + 2h WhatsApp reminders, updates no-show recovery. |
| `POST /api/apptflow/cron/campaigns` | every 15 min | Drips opt-in campaigns to leads and past customers. |
| `POST /api/apptflow/cron/fx-sync` | daily 03:00 UTC | Refreshes USD rates for local-currency pricing. |
| `POST /api/apptflow/cron/cost-recalc` | daily 03:30 UTC | Recomputes per-tenant cost; pricing agent bumps price if margin < 10%. |

Test one from your terminal:

```powershell
curl.exe -H "Authorization: Bearer $env:APPTFLOW_CRON_SECRET" `
  https://modulusaas.com/api/apptflow/cron/fx-sync
# expected: { "ok": true, "updated": 12 }
```

---

## 8) Smoke test the signup flow

Once steps 1–5 are done:

```powershell
$body = @{
  owner_user_id   = [guid]::NewGuid().ToString()
  owner_email     = "you+test@modulustech.app"
  business_name   = "Test Clinic"
  vertical        = "dental"
  timezone        = "Europe/Istanbul"
  locale          = "en"
  currency        = "USD"
  plan_code       = "pro"
  billing_cycle   = "monthly"
} | ConvertTo-Json

curl.exe -X POST -H "Content-Type: application/json" `
  -d $body `
  https://modulusaas.com/api/apptflow/signup
```

You get back:

```json
{
  "ok": true,
  "tenant_id": "…",
  "checkout_url": "https://<your-store>.lemonsqueezy.com/checkout/custom/…",
  "lemon_checkout_id": "…",
  "quote": { "monthlyUnitAmountMinor": 7900, "currency": "USD", ... },
  "google_calendar_connect_url": "https://modulusaas.com/api/apptflow/calendar/google/start?tenant_id=…"
}
```

Open the `checkout_url` in your browser — you will land on the hosted
Lemon Squeezy checkout, branded with your store logo, in local currency.

---

## 9) Send the URL to Lemon Squeezy

The marketing page is already live at:

**https://modulusaas.com/products/appointflow**

This is the URL you provide to Lemon Squeezy for merchant verification.
It has:

- Full product description and feature grid
- Transparent pricing in USD
- 8-question FAQ (covering refunds, GDPR/KVKK, WhatsApp migration)
- Links to `/mesafeli-satis` (terms), `/gizlilik` (privacy)
- "Start 7-Day Free Trial" CTA that deep-links into the Lemon checkout

---

## Architecture one-pager (for reference)

```
Browser / WhatsApp / Google
        │
        ▼
┌────────────────────────────┐
│  Next.js App Router        │   modulusaas.com
│  app/products/appointflow  │   marketing pages
│  app/api/apptflow/*        │   REST endpoints
└────────────┬───────────────┘
             │
             ▼
┌────────────────────────────┐
│  Supabase (apptflow schema)│
│  - tenants, appointments,  │
│    subscriptions, …        │
│  - RLS by owner_user_id    │
│  - Edge Function:          │
│    apptflow-orchestrator   │
└────────────┬───────────────┘
             │
             ▼
    ┌────────┴────────┐
    ▼                 ▼
┌───────┐     ┌──────────────┐
│ Lemon │     │  External    │
│Squeezy│     │  APIs:       │
│(MoR)  │     │  - WhatsApp  │
│       │     │  - Google    │
│       │     │  - OpenAI    │
└───────┘     └──────────────┘
```

Eleven autonomous agents run inside the orchestrator Edge Function;
each agent subscribes to a subset of `OrchestratorEvent` values in
`lib/apptflow/types.ts`. Event names are intentionally verbose — if
`subscription.payment_failed` fires, the Billing agent retries the
card, the Retention agent sends a "update card" WhatsApp message, and
the Compliance agent notes the attempt in `agent_runs`.
