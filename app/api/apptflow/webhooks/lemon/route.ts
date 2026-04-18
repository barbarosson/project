import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/apptflow/supabase'
import { verifyWebhookSignature, type LemonWebhookBody, type LemonWebhookEvent } from '@/lib/apptflow/lemon'
import { dispatchEvent } from '@/lib/apptflow/orchestrator'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// Next.js App Router: receive the raw body for signature verification.
export const preferredRegion = 'auto'

// Lemon Squeezy delivers a POST with:
//   Header:  X-Signature: <hex hmac-sha256 of body with webhook secret>
//   Header:  X-Event-Name: <event name>
//   Body:    JSON:API shape { meta: { event_name, custom_data }, data: {...} }
//
// Docs: https://docs.lemonsqueezy.com/help/webhooks
export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-signature')

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ ok: false, error: 'invalid_signature' }, { status: 401 })
  }

  let body: LemonWebhookBody
  try { body = JSON.parse(rawBody) } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const event = body.meta.event_name
  const tenantId = body.meta.custom_data?.apptflow_tenant_id ?? null
  const attrs = body.data.attributes

  const sb = getServiceSupabase()

  try {
    if (tenantId && isSubscriptionEvent(event)) {
      await handleSubscription(sb, tenantId, event, body)
    } else if (event === 'order_created') {
      // One-off receipts — nothing to update on subscriptions; just log.
    }
  } catch (err) {
    console.error('[apptflow:lemon] handler error', event, (err as Error).message)
    // Still ack 200 — Lemon will not retry for a 4xx/5xx and we do not
    // want partial handler failures to re-fire the whole batch.
  }

  // Mirror the event on to the orchestrator for downstream agents
  // (retention, billing, compliance).
  try {
    await dispatchEvent({
      event: `lemon.${event}`,
      tenant_id: tenantId,
      payload: {
        lemon_event: event,
        subscription_id: body.data.id,
        variant_id: attrs.variant_id,
        status: attrs.status,
        renews_at: attrs.renews_at,
        ends_at: attrs.ends_at,
        total: attrs.total,
        currency: attrs.currency,
      },
    })
  } catch (err) {
    console.warn('[apptflow:lemon] orchestrator dispatch failed', (err as Error).message)
  }

  return NextResponse.json({ ok: true, event, tenant_id: tenantId })
}

function isSubscriptionEvent(event: LemonWebhookEvent): boolean {
  return event.startsWith('subscription_')
}

async function handleSubscription(
  sb: ReturnType<typeof getServiceSupabase>,
  tenantId: string,
  event: LemonWebhookEvent,
  body: LemonWebhookBody,
) {
  const attrs = body.data.attributes
  const lemonSubId = body.data.id

  // Map Lemon Squeezy status → internal subscription status.
  const statusMap: Record<string, string> = {
    on_trial:   'trialing',
    active:     'active',
    paused:     'paused',
    past_due:   'past_due',
    unpaid:     'unpaid',
    cancelled:  'cancelled',
    expired:    'cancelled',
  }
  const internalStatus = (attrs.status && statusMap[attrs.status]) || 'active'

  const update: Record<string, any> = {
    lemon_subscription_id: lemonSubId,
    lemon_customer_id: attrs.customer_id ? String(attrs.customer_id) : null,
    lemon_variant_id: attrs.variant_id ? String(attrs.variant_id) : null,
    status: internalStatus,
    current_period_end: attrs.renews_at ?? null,
    trial_ends_at: attrs.trial_ends_at ?? null,
    cancel_at_period_end: attrs.cancelled === true,
    last_invoice_id: null,
    updated_at: new Date().toISOString(),
  }

  if (event === 'subscription_payment_failed') {
    // Atomic-ish increment of the failure counter.
    const { data: sub } = await sb
      .from('subscriptions')
      .select('failed_payment_count')
      .eq('tenant_id', tenantId)
      .maybeSingle()
    update.failed_payment_count = (sub?.failed_payment_count ?? 0) + 1
  } else if (event === 'subscription_payment_success' || event === 'subscription_payment_recovered') {
    update.failed_payment_count = 0
  }

  const { error } = await sb
    .from('subscriptions')
    .update(update)
    .eq('tenant_id', tenantId)

  if (error) {
    throw new Error(`subscriptions update failed: ${error.message}`)
  }
}
