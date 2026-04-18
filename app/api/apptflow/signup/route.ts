import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServiceSupabase } from '@/lib/apptflow/supabase'
import { quotePlan } from '@/lib/apptflow/pricing'
import { createCheckoutSession, type PlanCode, type BillingCycle } from '@/lib/apptflow/lemon'
import { env } from '@/lib/apptflow/env'
import { dispatchEvent } from '@/lib/apptflow/orchestrator'
import type { CurrencyCode, LocaleCode } from '@/lib/apptflow/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Accepted plan codes. We only sell three tiers — growth was an internal
// label; the public product uses starter/pro/business.
const PLAN_CODES = ['starter', 'pro', 'business'] as const
const CYCLES = ['monthly', 'yearly'] as const

const schema = z.object({
  owner_user_id: z.string().uuid(),
  owner_email: z.string().email(),
  business_name: z.string().min(2).max(120),
  vertical: z.string().max(40).default('generic'),
  country: z.string().length(2).optional(),
  timezone: z.string().default('UTC'),
  locale: z.string().default('en'),
  currency: z.string().length(3).default('USD'),
  plan_code: z.enum(PLAN_CODES).default('starter'),
  billing_cycle: z.enum(CYCLES).default('monthly'),
  whatsapp_phone_number_id: z.string().optional(),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'invalid_payload', details: parsed.error.flatten() }, { status: 400 })
  }
  const p = parsed.data

  const sb = getServiceSupabase()

  // Idempotent: reuse tenant for the same owner if present.
  const { data: existing } = await sb
    .from('tenants')
    .select('id')
    .eq('owner_user_id', p.owner_user_id)
    .maybeSingle()

  let tenantId = existing?.id
  if (!tenantId) {
    const { data: inserted, error } = await sb
      .from('tenants')
      .insert({
        owner_user_id: p.owner_user_id,
        business_name: p.business_name,
        vertical: p.vertical,
        country: p.country ?? null,
        timezone: p.timezone,
        default_locale: p.locale as LocaleCode,
        default_currency: p.currency.toUpperCase() as CurrencyCode,
        whatsapp_phone_number_id: p.whatsapp_phone_number_id ?? null,
        status: 'onboarding',
      })
      .select('id')
      .single()
    if (error) {
      return NextResponse.json({ ok: false, error: 'tenant_insert_failed', message: error.message }, { status: 500 })
    }
    tenantId = inserted.id
  }

  // Margin-safe quote (informational — Lemon Squeezy charges the variant
  // price; we store the quote to detect mismatch / re-price.)
  const quote = await quotePlan(p.plan_code, p.currency.toUpperCase() as CurrencyCode, 0)

  const { data: planRow } = await sb
    .from('pricing_plans')
    .select('id')
    .eq('code', p.plan_code)
    .single()

  await sb.from('subscriptions').upsert(
    {
      tenant_id: tenantId,
      plan_id: planRow!.id,
      billing_currency: p.currency.toUpperCase(),
      status: 'trialing',
      trial_ends_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    },
    { onConflict: 'tenant_id' },
  )

  const { url, checkoutId } = await createCheckoutSession({
    tenantId: tenantId!,
    plan: p.plan_code as PlanCode,
    cycle: p.billing_cycle as BillingCycle,
    customerEmail: p.owner_email,
    customerName: p.business_name,
    successUrl: `${env.publicUrl()}/onboarding?checkout=success&tenant=${tenantId}`,
    locale: p.locale,
  })

  await dispatchEvent({
    event: 'subscription.created',
    tenant_id: tenantId!,
    payload: { plan: p.plan_code, cycle: p.billing_cycle, currency: p.currency.toUpperCase(), quote, lemon_checkout_id: checkoutId },
  })

  return NextResponse.json({
    ok: true,
    tenant_id: tenantId,
    checkout_url: url,
    lemon_checkout_id: checkoutId,
    quote,
    google_calendar_connect_url: `${env.publicUrl()}/api/apptflow/calendar/google/start?tenant_id=${tenantId}`,
  })
}
