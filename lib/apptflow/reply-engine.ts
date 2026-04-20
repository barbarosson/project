// Reply engine.
//
// This is the in-process "brain" that runs on the Next.js webhook path
// every time a WhatsApp inbound message is persisted. It inspects the
// detected intent + prior bot outbound state and replies in the tenant's
// locale, using the booking helpers to actually move the world.
//
// Design goals:
//   * No external service beyond what's already wired (Supabase, WA Cloud,
//     Google Calendar, optional OpenAI).
//   * Deterministic happy paths; LLM only as fallback for unknown intents.
//   * Idempotent-enough: if anything below throws, the webhook still
//     returns 200 (caller wraps us) so Meta doesn't retry-loop us.
//   * State survives in apptflow.conversations.metadata (no side tables).

import { getServiceSupabase } from './supabase'
import { sendText, type Intent } from './whatsapp'
import {
  createBooking,
  cancelBooking,
  rescheduleBooking,
  suggestOpenSlots,
} from './booking'
import { t } from './i18n'
import { env } from './env'
import type { LocaleCode } from './types'

// ---------- Types ----------

interface HandleInboundArgs {
  tenantId: string
  tenantLocale: LocaleCode
  tenantTimezone: string
  customerId: string | null
  customerPhoneE164: string      // always starts with '+'
  inboundText: string
  intent: Intent
}

type PendingAction =
  | null
  | 'slot_choice'                   // bot just listed slots → waiting for a pick
  | 'reschedule_slot_choice'        // bot offered new slots for a reschedule
  | 'cancel_confirm'                // bot asked "should I cancel your X appointment?"

interface OutboundMetadata {
  pending_action?: PendingAction
  slot_candidates?: { startsAt: string; endsAt: string }[]
  service_id?: string | null
  appointment_id?: string | null
  // When the bot itself replies we stamp this so future debugging is cheap.
  source?: 'reply-engine'
}

interface TenantRow {
  id: string
  default_locale: LocaleCode | null
  timezone: string | null
  business_name: string | null
}

// ---------- Public entry point ----------

export async function handleInbound(args: HandleInboundArgs): Promise<void> {
  try {
    await routeInbound(args)
  } catch (err) {
    console.error('[reply-engine] failed', {
      err: (err as Error).message,
      tenantId: args.tenantId,
      from: args.customerPhoneE164,
      intent: args.intent.intent,
    })
    // Best-effort fallback so the customer doesn't see silence.
    try {
      await sendAndRecord({
        tenantId: args.tenantId,
        toPlus: args.customerPhoneE164,
        locale: args.tenantLocale,
        text: t(args.tenantLocale, 'fallback'),
        metadata: { pending_action: null, source: 'reply-engine' },
      })
    } catch {
      /* ignore */
    }
  }
}

// ---------- Core router ----------

async function routeInbound(args: HandleInboundArgs): Promise<void> {
  const locale = args.tenantLocale
  const prior = await getLastOutboundState(args.tenantId, args.customerId)

  // 1) Conversational continuations (prior state + current text).
  if (prior?.pending_action === 'slot_choice') {
    const pick = pickSlot(args.inboundText, prior.slot_candidates ?? [])
    if (pick) {
      await bookSelectedSlot(args, pick, prior.service_id ?? null)
      return
    }
    // If the user said something else, drop the pending state and
    // route as a fresh intent below.
  }

  if (prior?.pending_action === 'reschedule_slot_choice' && prior.appointment_id) {
    const pick = pickSlot(args.inboundText, prior.slot_candidates ?? [])
    if (pick) {
      await rescheduleToSelectedSlot(args, prior.appointment_id, pick)
      return
    }
  }

  if (prior?.pending_action === 'cancel_confirm' && prior.appointment_id) {
    if (args.intent.intent === 'confirm' || /\b(yes|evet|si|sí|oui|ja|да|sim|نعم)\b/i.test(args.inboundText)) {
      await cancelBooking(prior.appointment_id)
      await sendAndRecord({
        tenantId: args.tenantId,
        toPlus: args.customerPhoneE164,
        locale,
        text: t(locale, 'fallback'),     // booking_cancelled already sent by cancelBooking
        metadata: { pending_action: null, source: 'reply-engine' },
      })
      return
    }
  }

  // 2) Fresh intent-based routing.
  switch (args.intent.intent) {
    case 'book':
      await offerSlotsForBooking(args, locale)
      return
    case 'cancel':
      await offerCancellation(args, locale)
      return
    case 'reschedule':
      await offerReschedule(args, locale)
      return
    case 'confirm':
      // Confirm without pending state = unclear. Fall back.
      await sendAndRecord({
        tenantId: args.tenantId,
        toPlus: args.customerPhoneE164,
        locale,
        text: t(locale, 'fallback'),
        metadata: { pending_action: null, source: 'reply-engine' },
      })
      return
    case 'info':
    case 'unknown':
    default:
      await unknownFallback(args, locale)
      return
  }
}

// ---------- Handlers ----------

async function offerSlotsForBooking(args: HandleInboundArgs, locale: LocaleCode): Promise<void> {
  const sb = getServiceSupabase()
  const { data: services } = await sb
    .from('services')
    .select('id, name, duration_minutes')
    .eq('tenant_id', args.tenantId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (!services || services.length === 0) {
    await sendAndRecord({
      tenantId: args.tenantId,
      toPlus: args.customerPhoneE164,
      locale,
      text: t(locale, 'fallback'),
      metadata: { pending_action: null, source: 'reply-engine' },
    })
    return
  }

  // MVP: use the first active service when only one is defined. When
  // multiple exist we still pick the first for now; a later iteration
  // will prompt ask_service and wait for a choice.
  const service = services[0]
  const slots = await suggestOpenSlots({
    tenantId: args.tenantId,
    durationMinutes: service.duration_minutes,
    lookaheadDays: 7,
  })

  if (slots.length === 0) {
    await sendAndRecord({
      tenantId: args.tenantId,
      toPlus: args.customerPhoneE164,
      locale,
      text: t(locale, 'fallback'),
      metadata: { pending_action: null, source: 'reply-engine' },
    })
    return
  }

  const pretty = slots
    .map((s, i) => `${i + 1}) ${formatSlotForHumans(s.startsAt, args.tenantTimezone, locale)}`)
    .join('  ·  ')

  await sendAndRecord({
    tenantId: args.tenantId,
    toPlus: args.customerPhoneE164,
    locale,
    text: t(locale, 'ask_time', { slots: pretty }),
    metadata: {
      pending_action: 'slot_choice',
      slot_candidates: slots,
      service_id: service.id,
      source: 'reply-engine',
    },
  })
}

async function bookSelectedSlot(
  args: HandleInboundArgs,
  slot: { startsAt: string; endsAt: string },
  serviceId: string | null,
): Promise<void> {
  if (!serviceId) {
    // No service locked in from prior turn — re-offer slots instead of silently failing.
    await offerSlotsForBooking(args, args.tenantLocale)
    return
  }
  try {
    await createBooking({
      tenantId: args.tenantId,
      serviceId,
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
      customerPhoneE164: args.customerPhoneE164,
      locale: args.tenantLocale,
      channel: 'bot',
    })
    // createBooking already sends the confirmation WhatsApp; we still
    // record the outbound in our own log so state is consistent.
    await recordOutboundStub({
      tenantId: args.tenantId,
      metadata: { pending_action: null, source: 'reply-engine' },
    })
  } catch (err) {
    // Slot collision or calendar error → re-offer slots.
    console.warn('[reply-engine] booking failed, re-offering slots', {
      msg: (err as Error).message,
    })
    await offerSlotsForBooking(args, args.tenantLocale)
  }
}

async function offerCancellation(args: HandleInboundArgs, locale: LocaleCode): Promise<void> {
  if (!args.customerId) {
    await sendAndRecord({
      tenantId: args.tenantId,
      toPlus: args.customerPhoneE164,
      locale,
      text: t(locale, 'fallback'),
      metadata: { pending_action: null, source: 'reply-engine' },
    })
    return
  }

  const sb = getServiceSupabase()
  const { data: appt } = await sb
    .from('appointments')
    .select('id, starts_at, service:services(name)')
    .eq('tenant_id', args.tenantId)
    .eq('customer_id', args.customerId)
    .in('status', ['scheduled', 'confirmed', 'rescheduled'])
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(1)
    .maybeSingle<any>()

  if (!appt) {
    await sendAndRecord({
      tenantId: args.tenantId,
      toPlus: args.customerPhoneE164,
      locale,
      text: t(locale, 'fallback'),
      metadata: { pending_action: null, source: 'reply-engine' },
    })
    return
  }

  // Single-turn cancel: do it now, notification will be sent by cancelBooking().
  await cancelBooking(appt.id)
  await recordOutboundStub({
    tenantId: args.tenantId,
    metadata: { pending_action: null, source: 'reply-engine' },
  })
}

async function offerReschedule(args: HandleInboundArgs, locale: LocaleCode): Promise<void> {
  if (!args.customerId) {
    await unknownFallback(args, locale)
    return
  }

  const sb = getServiceSupabase()
  const { data: appt } = await sb
    .from('appointments')
    .select('id, service:services(id, name, duration_minutes)')
    .eq('tenant_id', args.tenantId)
    .eq('customer_id', args.customerId)
    .in('status', ['scheduled', 'confirmed'])
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(1)
    .maybeSingle<any>()

  if (!appt || !appt.service) {
    await unknownFallback(args, locale)
    return
  }

  const slots = await suggestOpenSlots({
    tenantId: args.tenantId,
    durationMinutes: appt.service.duration_minutes,
    lookaheadDays: 7,
  })

  if (slots.length === 0) {
    await unknownFallback(args, locale)
    return
  }

  const pretty = slots
    .map((s, i) => `${i + 1}) ${formatSlotForHumans(s.startsAt, args.tenantTimezone, locale)}`)
    .join('  ·  ')

  await sendAndRecord({
    tenantId: args.tenantId,
    toPlus: args.customerPhoneE164,
    locale,
    text: t(locale, 'ask_time', { slots: pretty }),
    metadata: {
      pending_action: 'reschedule_slot_choice',
      slot_candidates: slots,
      appointment_id: appt.id,
      source: 'reply-engine',
    },
  })
}

async function rescheduleToSelectedSlot(
  args: HandleInboundArgs,
  appointmentId: string,
  slot: { startsAt: string; endsAt: string },
): Promise<void> {
  try {
    await rescheduleBooking({
      appointmentId,
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
    })
  } catch (err) {
    console.warn('[reply-engine] reschedule failed', { msg: (err as Error).message })
    await unknownFallback(args, args.tenantLocale)
    return
  }
  await sendAndRecord({
    tenantId: args.tenantId,
    toPlus: args.customerPhoneE164,
    locale: args.tenantLocale,
    text: t(args.tenantLocale, 'booking_rescheduled', {
      service: '',
      when: formatSlotForHumans(slot.startsAt, args.tenantTimezone, args.tenantLocale),
    }),
    metadata: { pending_action: null, source: 'reply-engine' },
  })
}

async function unknownFallback(args: HandleInboundArgs, locale: LocaleCode): Promise<void> {
  const openAiKey = env.openAiKey()
  let replyText: string | null = null

  if (openAiKey) {
    replyText = await tryLlmReply({
      apiKey: openAiKey,
      model: env.openAiModel(),
      locale,
      businessContext: await getBusinessContext(args.tenantId),
      lastUserMessage: args.inboundText,
    })
  }

  const finalText = replyText?.trim() || t(locale, 'fallback')

  await sendAndRecord({
    tenantId: args.tenantId,
    toPlus: args.customerPhoneE164,
    locale,
    text: finalText,
    metadata: {
      pending_action: null,
      source: 'reply-engine',
    },
  })
}

// ---------- Helpers ----------

interface LastOutboundState {
  pending_action: PendingAction
  slot_candidates?: { startsAt: string; endsAt: string }[]
  service_id?: string | null
  appointment_id?: string | null
}

async function getLastOutboundState(
  tenantId: string,
  customerId: string | null,
): Promise<LastOutboundState | null> {
  if (!customerId) return null
  const sb = getServiceSupabase()
  const { data } = await sb
    .from('conversations')
    .select('metadata, created_at, direction')
    .eq('tenant_id', tenantId)
    .eq('customer_id', customerId)
    .eq('direction', 'outbound')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<any>()
  const md = (data?.metadata ?? {}) as OutboundMetadata
  if (!md.pending_action) return null
  return {
    pending_action: md.pending_action,
    slot_candidates: md.slot_candidates,
    service_id: md.service_id ?? null,
    appointment_id: md.appointment_id ?? null,
  }
}

function pickSlot(
  text: string,
  slots: { startsAt: string; endsAt: string }[],
): { startsAt: string; endsAt: string } | null {
  if (slots.length === 0) return null
  const trimmed = text.trim().toLowerCase()
  // Numeric pick: "1", "2", "3" or "#2"
  const num = trimmed.match(/\b([1-9])\b/)
  if (num) {
    const idx = Number(num[1]) - 1
    if (idx >= 0 && idx < slots.length) return slots[idx]
  }
  // Time-based pick: "14:00", "15.30", "3pm"
  const time = trimmed.match(/\b(\d{1,2})[:.](\d{2})\b/)
  if (time) {
    const hh = Number(time[1])
    const mm = Number(time[2])
    const match = slots.find(s => {
      const d = new Date(s.startsAt)
      return d.getUTCHours() === hh && d.getUTCMinutes() === mm
    })
    if (match) return match
  }
  const pm = trimmed.match(/\b(\d{1,2})\s?(am|pm)\b/)
  if (pm) {
    let hh = Number(pm[1])
    if (pm[2] === 'pm' && hh < 12) hh += 12
    if (pm[2] === 'am' && hh === 12) hh = 0
    const match = slots.find(s => new Date(s.startsAt).getUTCHours() === hh)
    if (match) return match
  }
  return null
}

function formatSlotForHumans(iso: string, tz: string | null, locale: LocaleCode): string {
  const d = new Date(iso)
  try {
    return d.toLocaleString(locale, {
      timeZone: tz ?? 'UTC',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return d.toISOString()
  }
}

interface SendAndRecordArgs {
  tenantId: string
  toPlus: string                              // '+90...'
  locale: LocaleCode
  text: string
  metadata: OutboundMetadata
}

async function sendAndRecord(a: SendAndRecordArgs): Promise<void> {
  let waMessageId = ''
  try {
    const res = await sendText({
      tenantId: a.tenantId,
      to: a.toPlus.replace(/^\+/, ''),
      text: a.text,
    })
    waMessageId = res.messageId
  } catch (err) {
    console.error('[reply-engine] sendText failed', {
      err: (err as Error).message,
      tenantId: a.tenantId,
      to: a.toPlus,
    })
    // Still log the outbound attempt so future turns know the state.
  }

  const sb = getServiceSupabase()
  await sb.from('conversations').insert({
    tenant_id: a.tenantId,
    customer_id: null,                       // customer resolution handled separately in webhook
    wa_message_id: waMessageId || null,
    direction: 'outbound',
    channel: 'whatsapp',
    message_text: a.text,
    message_type: 'text',
    language: a.locale,
    metadata: a.metadata,
  })
}

// Used when the outbound text itself was sent by another helper
// (e.g. createBooking emits the confirmation). We still stamp an audit
// row so pending_action is reset to null.
async function recordOutboundStub(a: {
  tenantId: string
  metadata: OutboundMetadata
}): Promise<void> {
  const sb = getServiceSupabase()
  await sb.from('conversations').insert({
    tenant_id: a.tenantId,
    direction: 'outbound',
    channel: 'system',
    message_type: 'system',
    metadata: a.metadata,
  })
}

// ---------- LLM fallback (optional) ----------

async function getBusinessContext(tenantId: string): Promise<string> {
  const sb = getServiceSupabase()
  const { data: tenant } = await sb
    .from('tenants')
    .select('business_name, vertical, country, timezone, default_locale')
    .eq('id', tenantId)
    .maybeSingle<TenantRow & { vertical: string | null; country: string | null }>()
  const { data: services } = await sb
    .from('services')
    .select('name, duration_minutes')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .limit(5)

  const lines = [
    `Business: ${tenant?.business_name ?? 'unknown'}`,
    `Vertical: ${tenant?.vertical ?? 'service business'}`,
    `Timezone: ${tenant?.timezone ?? 'UTC'}`,
    `Services: ${(services ?? []).map(s => `${s.name} (${s.duration_minutes}min)`).join(', ') || 'unspecified'}`,
  ]
  return lines.join('\n')
}

async function tryLlmReply(args: {
  apiKey: string
  model: string
  locale: LocaleCode
  businessContext: string
  lastUserMessage: string
}): Promise<string | null> {
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${args.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: args.model,
        temperature: 0.2,
        max_tokens: 200,
        messages: [
          {
            role: 'system',
            content: [
              `You are a WhatsApp appointment assistant for a small service business.`,
              `Always reply in the locale code: ${args.locale}.`,
              `Reply in 1–2 short sentences. Do NOT invent times, prices or services.`,
              `If the user wants to book, ask them to reply "book" so the system can offer slots.`,
              `If the user wants to cancel or reschedule, ask them to reply "cancel" or "reschedule".`,
              `Business context:`,
              args.businessContext,
            ].join('\n'),
          },
          { role: 'user', content: args.lastUserMessage.slice(0, 500) },
        ],
      }),
    })
    if (!res.ok) {
      console.warn('[reply-engine] openai non-200', res.status)
      return null
    }
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[]
    }
    return json.choices?.[0]?.message?.content?.trim() ?? null
  } catch (err) {
    console.warn('[reply-engine] openai exception', (err as Error).message)
    return null
  }
}
