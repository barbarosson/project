import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/apptflow/env'
import { verifyWebhookSignature, detectIntent } from '@/lib/apptflow/whatsapp'
import { getServiceSupabase } from '@/lib/apptflow/supabase'
import { dispatchEvent } from '@/lib/apptflow/orchestrator'
import { recordUsage } from '@/lib/apptflow/cost'

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
        .select('id, default_locale')
        .eq('whatsapp_phone_number_id', phoneNumberId)
        .maybeSingle()

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

        await sb.from('conversations').insert({
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
        }
      }

      // Delivery / read statuses.
      for (const st of value.statuses ?? []) {
        await sb.from('conversations').insert({
          tenant_id: tenant?.id ?? null,
          wa_message_id: st.id,
          direction: 'outbound',
          channel: 'system',
          message_text: null,
          message_type: 'system',
          intent: `status.${st.status}`,
        })
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
