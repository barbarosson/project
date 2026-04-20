import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/apptflow/env'
import { verifyWebhookSignature, detectIntent } from '@/lib/apptflow/whatsapp'
import { getServiceSupabase } from '@/lib/apptflow/supabase'
import { dispatchEvent } from '@/lib/apptflow/orchestrator'
import { recordUsage } from '@/lib/apptflow/cost'
import { handleInbound } from '@/lib/apptflow/reply-engine'
import type { LocaleCode } from '@/lib/apptflow/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// --- Meta GET handshake (one-time webhook verification) -------------
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get('hub.mode')
  const token = req.nextUrl.searchParams.get('hub.verify_token')
  const challenge = req.nextUrl.searchParams.get('hub.challenge')
  if (mode === 'subscribe' && token === env.waVerifyToken() && challenge) {
    return new NextResponse(challenge, { status: 200 })
  }
  return NextResponse.json({ ok: false, error: 'verify_failed' }, { status: 403 })
}

// --- Meta event POST ------------------------------------------------
export async function POST(req: NextRequest) {
  const raw = Buffer.from(await req.arrayBuffer()).toString('utf8')
  const signature = req.headers.get('x-hub-signature-256')
  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ ok: false, error: 'bad_signature' }, { status: 401 })
  }

  let body: any
  try { body = JSON.parse(raw) } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const sb = getServiceSupabase()

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value ?? {}
      const phoneNumberId: string = value.metadata?.phone_number_id

      // Look up tenant by the WA phone_number_id that received the message.
      const { data: tenant } = await sb
        .from('tenants')
        .select('id, default_locale, timezone, business_name')
        .eq('whatsapp_phone_number_id', phoneNumberId)
        .maybeSingle<{
          id: string
          default_locale: LocaleCode | null
          timezone: string | null
          business_name: string | null
        }>()

      for (const msg of value.messages ?? []) {
        const from: string = msg.from
        const text: string = msg.text?.body ?? msg.button?.text ?? msg.interactive?.button_reply?.title ?? ''
        const waId: string = msg.id

        const intent = detectIntent(text)

        // Try to resolve the customer.
        let customerId: string | null = null
        if (tenant) {
          const phone = from.startsWith('+') ? from : `+${from}`
          const { data: existing } = await sb
            .from('customers')
            .select('id')
            .eq('tenant_id', tenant.id)
            .eq('phone_e164', phone)
            .maybeSingle()
          customerId = existing?.id ?? null
          if (!customerId) {
            const { data: inserted } = await sb
              .from('customers')
              .insert({ tenant_id: tenant.id, phone_e164: phone })
              .select('id')
              .single()
            customerId = inserted?.id ?? null
          }
        }

        const { error: convInsertErr } = await sb.from('conversations').insert({
          tenant_id: tenant?.id ?? null,
          customer_id: customerId,
          wa_message_id: waId,
          direction: 'inbound',
          channel: 'whatsapp',
          message_text: text,
          message_type: msg.type ?? 'text',
          intent: intent.intent,
          confidence: intent.confidence,
        })
        if (convInsertErr) {
          console.error('[wa webhook] inbound conversation insert failed', {
            err: convInsertErr.message,
            code: convInsertErr.code,
            phoneNumberId,
            from,
            hasTenant: Boolean(tenant?.id),
          })
        }

        if (tenant) {
          await recordUsage(tenant.id, 'whatsapp.inbound', 1, { type: msg.type ?? 'text' })
          await dispatchEvent({
            event: 'whatsapp.inbound',
            tenant_id: tenant.id,
            payload: {
              from,
              text,
              intent: intent.intent,
              confidence: intent.confidence,
              customer_id: customerId,
              wa_message_id: waId,
            },
          })

          // In-process reply: intent routing, slot offers, booking, etc.
          // Wrapped in try/catch inside the engine itself so a fault here
          // never yields a 500 back to Meta (which would trigger retries).
          const phoneE164 = from.startsWith('+') ? from : `+${from}`
          await handleInbound({
            tenantId: tenant.id,
            tenantLocale: (tenant.default_locale ?? 'en') as LocaleCode,
            tenantTimezone: tenant.timezone ?? 'UTC',
            customerId,
            customerPhoneE164: phoneE164,
            inboundText: text,
            intent,
          })
        }
      }

      // Delivery / read statuses.
      for (const st of value.statuses ?? []) {
        const { error: statusInsertErr } = await sb.from('conversations').insert({
          tenant_id: tenant?.id ?? null,
          wa_message_id: st.id,
          direction: 'outbound',
          channel: 'system',
          message_text: null,
          message_type: 'system',
          intent: `status.${st.status}`,
        })
        if (statusInsertErr) {
          console.error('[wa webhook] status conversation insert failed', {
            err: statusInsertErr.message,
            code: statusInsertErr.code,
            phoneNumberId,
            statusKind: st.status,
          })
        }
        if (tenant) {
          await dispatchEvent({
            event: 'whatsapp.delivery',
            tenant_id: tenant.id,
            payload: { status: st.status, wa_message_id: st.id },
          })
        }
      }
    }
  }

  return NextResponse.json({ ok: true })
}
