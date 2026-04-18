import crypto from 'node:crypto'
import { env } from './env'

// ----------------------------------------------------------------
// Lemon Squeezy client — minimal, fetch-based, no SDK dependency
// https://docs.lemonsqueezy.com/api
// ----------------------------------------------------------------

const LEMON_API = 'https://api.lemonsqueezy.com/v1'

type JsonApiResource<T = Record<string, any>> = {
  id: string
  type: string
  attributes: T
  relationships?: Record<string, { data: { id: string; type: string } | null }>
  links?: Record<string, string>
}

type JsonApiResponse<T = Record<string, any>> = {
  data: JsonApiResource<T> | JsonApiResource<T>[]
  included?: JsonApiResource[]
  links?: Record<string, string>
  meta?: Record<string, any>
}

async function lsFetch<T = any>(
  path: string,
  init: RequestInit & { method?: string } = {},
): Promise<JsonApiResponse<T>> {
  const res = await fetch(`${LEMON_API}${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      Authorization: `Bearer ${env.lemonApiKey()}`,
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`Lemon Squeezy API ${res.status} ${res.statusText}: ${text.slice(0, 500)}`)
  }
  return text ? (JSON.parse(text) as JsonApiResponse<T>) : ({ data: [] as any })
}

// ----------------------------------------------------------------
// Variant resolution: map an AppointFlow plan_code + cycle → Lemon variant id.
// Prefer the env override (prod); otherwise discover by slug.
// ----------------------------------------------------------------

export type PlanCode = 'starter' | 'pro' | 'business'
export type BillingCycle = 'monthly' | 'yearly'

function variantFromEnv(plan: PlanCode, cycle: BillingCycle): string {
  switch (`${plan}_${cycle}`) {
    case 'starter_monthly': return env.lemonVariantStarterMonthly()
    case 'starter_yearly':  return env.lemonVariantStarterYearly()
    case 'pro_monthly':     return env.lemonVariantProMonthly()
    case 'pro_yearly':      return env.lemonVariantProYearly()
    case 'business_monthly': return env.lemonVariantBusinessMonthly()
    case 'business_yearly':  return env.lemonVariantBusinessYearly()
    default: return ''
  }
}

export function resolveVariantId(plan: PlanCode, cycle: BillingCycle): string {
  const v = variantFromEnv(plan, cycle)
  if (!v) {
    throw new Error(
      `Missing LEMON_VARIANT_${plan.toUpperCase()}_${cycle.toUpperCase()} env var. ` +
      `Create the variant in your Lemon Squeezy dashboard and set the env variable.`,
    )
  }
  return v
}

// ----------------------------------------------------------------
// Create a hosted checkout session
// Docs: https://docs.lemonsqueezy.com/api/checkouts/create-checkout
// ----------------------------------------------------------------

export type CreateCheckoutArgs = {
  tenantId: string
  plan: PlanCode
  cycle: BillingCycle
  customerEmail: string
  customerName?: string
  successUrl: string
  locale?: string
}

export type CreatedCheckout = {
  url: string
  checkoutId: string
}

export async function createCheckoutSession(args: CreateCheckoutArgs): Promise<CreatedCheckout> {
  const storeId = env.lemonStoreId()
  const variantId = resolveVariantId(args.plan, args.cycle)

  const body = {
    data: {
      type: 'checkouts',
      attributes: {
        checkout_data: {
          email: args.customerEmail,
          name: args.customerName,
          custom: {
            apptflow_tenant_id: args.tenantId,
            apptflow_plan: args.plan,
            apptflow_cycle: args.cycle,
          },
        },
        checkout_options: {
          embed: false,
          media: false,
          logo: true,
          dark: false,
        },
        product_options: {
          redirect_url: args.successUrl,
          receipt_thank_you_note: 'Thank you for choosing Modulus AppointFlow!',
          receipt_link_url: args.successUrl,
          enabled_variants: [Number(variantId)],
        },
        expires_at: new Date(Date.now() + 24 * 3600_000).toISOString(),
      },
      relationships: {
        store:   { data: { type: 'stores',   id: String(storeId) } },
        variant: { data: { type: 'variants', id: String(variantId) } },
      },
    },
  }

  const res = await lsFetch<{ url: string }>('/checkouts', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  const data = Array.isArray(res.data) ? res.data[0] : res.data
  if (!data?.attributes?.url) {
    throw new Error('Lemon Squeezy checkout did not return a URL')
  }
  return { url: data.attributes.url, checkoutId: data.id }
}

// ----------------------------------------------------------------
// Webhook signature verification (X-Signature header, HMAC-SHA256 hex)
// Docs: https://docs.lemonsqueezy.com/help/webhooks
// ----------------------------------------------------------------

export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false
  const secret = env.lemonWebhookSecret()
  const digest = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex')
  const a = Buffer.from(digest, 'hex')
  const b = Buffer.from(signature, 'hex')
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

// ----------------------------------------------------------------
// Webhook event shapes we care about (partial typing)
// ----------------------------------------------------------------

export type LemonWebhookEvent =
  | 'order_created'
  | 'order_refunded'
  | 'subscription_created'
  | 'subscription_updated'
  | 'subscription_cancelled'
  | 'subscription_resumed'
  | 'subscription_expired'
  | 'subscription_paused'
  | 'subscription_unpaused'
  | 'subscription_payment_success'
  | 'subscription_payment_failed'
  | 'subscription_payment_recovered'
  | 'subscription_payment_refunded'
  | 'subscription_plan_changed'
  | 'license_key_created'

export type LemonWebhookBody = {
  meta: {
    event_name: LemonWebhookEvent
    custom_data?: {
      apptflow_tenant_id?: string
      apptflow_plan?: PlanCode
      apptflow_cycle?: BillingCycle
    }
  }
  data: {
    id: string
    type: string
    attributes: {
      store_id?: number
      customer_id?: number
      order_id?: number
      order_item_id?: number
      product_id?: number
      variant_id?: number
      product_name?: string
      variant_name?: string
      user_name?: string
      user_email?: string
      status?: string
      status_formatted?: string
      card_brand?: string | null
      card_last_four?: string | null
      pause?: any
      cancelled?: boolean
      trial_ends_at?: string | null
      billing_anchor?: number
      renews_at?: string | null
      ends_at?: string | null
      created_at?: string
      updated_at?: string
      total?: number
      currency?: string
    }
  }
}
