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
  isSlotAvailable,
} from './booking'
import { t } from './i18n'
import { env } from './env'
import {
  parseDayHint,
  computeDayBounds,
  computeCurrentWeekBounds,
  weekdayLabel,
  extractTimeHint,
  tzLocalToUtcISO,
} from './date-hints'
import type { LocaleCode } from './types'

// ---------- Types ----------

interface HandleInboundArgs {
  tenantId: string
  tenantLocale: LocaleCode       // business default (used only as fallback)
  tenantTimezone: string
  customerId: string | null
  customerLocale?: LocaleCode    // language of THIS customer, detected from inbound
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
  confirm_all?: boolean
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
  const effectiveLocale: LocaleCode = args.customerLocale ?? args.tenantLocale
  try {
    await routeInbound(args, effectiveLocale)
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
        customerId: args.customerId,
        toPlus: args.customerPhoneE164,
        locale: effectiveLocale,
        text: t(effectiveLocale, 'fallback'),
        metadata: { pending_action: null, source: 'reply-engine' },
      })
    } catch {
      /* ignore */
    }
  }
}

// ---------- Core router ----------

async function routeInbound(args: HandleInboundArgs, locale: LocaleCode): Promise<void> {
  const prior = await getLastOutboundState(args.tenantId, args.customerId)
  const explicitDayHint = parseDayHint(args.inboundText)
  const explicitTimeHint = extractTimeHint(args.inboundText)
  const explicitAppointmentLookup = args.intent.intent === 'appointment_lookup'
  const likelyAvailability = looksLikeAvailabilityMessage(args.inboundText)

  // 1) Conversational continuations (prior state + current text).
  if (prior?.pending_action === 'slot_choice') {
    // If user asks a fresh day/time question (or appointment lookup),
    // don't interpret numeric tokens as slot indexes from old state.
    if (explicitAppointmentLookup || explicitDayHint || explicitTimeHint) {
      // fall through to fresh intent routing below
    } else {
    const candidates = prior.slot_candidates ?? []
    const picks = pickSlots(args.inboundText, candidates)
    if (picks.length > 0) {
      for (const slot of picks) {
        await bookSelectedSlot(args, slot, prior.service_id ?? null)
      }
      return
    }
    if (
      prior.confirm_all &&
      (args.intent.intent === 'confirm' || isMultiConfirm(args.inboundText))
    ) {
      for (const slot of candidates) {
        await bookSelectedSlot(args, slot, prior.service_id ?? null)
      }
      return
    }
    // Convenience: when only one slot is pending and the customer says
    // "yes / evet / ok / tamam", treat that as picking slot #1. This is
    // the happy path after we proactively offered a specific requested
    // time ("Cuma 15:00 uygun, EVET yazın.").
    if (
      candidates.length === 1 &&
      (args.intent.intent === 'confirm' ||
        /\b(yes|evet|tamam|ok|okay|si|sí|oui|ja|да|sim|نعم)\b/i.test(args.inboundText))
    ) {
      await bookSelectedSlot(args, candidates[0], prior.service_id ?? null)
      return
    }

    // If customer says "ikisini / both" after a sequence of specific-time
    // availability checks, merge recent single-slot pending offers and book
    // all of them in one go.
    if (isMultiConfirm(args.inboundText)) {
      const recent = await getRecentPendingSlots(args.tenantId, args.customerId)
      if (recent.length >= 2) {
        for (const r of recent) {
          await bookSelectedSlot(args, r.slot, r.serviceId)
        }
        return
      }
      if (candidates.length === 1) {
        await bookSelectedSlot(args, candidates[0], prior.service_id ?? null)
        return
      }
      return
    }
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
      await cancelBooking(prior.appointment_id, undefined, locale)
      await recordOutboundStub({
        tenantId: args.tenantId,
        customerId: args.customerId,
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
        customerId: args.customerId,
      toPlus: args.customerPhoneE164,
        locale,
        text: t(locale, 'fallback'),
        metadata: { pending_action: null, source: 'reply-engine' },
      })
      return
    case 'appointment_lookup':
      await answerAppointmentLookup(args, locale)
      return
    case 'appointment_list':
      await answerAppointmentList(args, locale)
      return
    case 'info':
    case 'unknown':
      // Safety net: availability questions must stay deterministic and never
      // fall into LLM "I can't be sure" style answers.
      if (likelyAvailability || explicitDayHint || explicitTimeHint) {
        await offerSlotsForBooking(args, locale)
        return
      }
    default:
      await unknownFallback(args, locale)
      return
  }
}

async function answerAppointmentLookup(args: HandleInboundArgs, locale: LocaleCode): Promise<void> {
  if (!args.customerId) {
    await sendAndRecord({
      tenantId: args.tenantId,
      customerId: args.customerId,
      toPlus: args.customerPhoneE164,
      locale,
      text: t(locale, 'appointment_lookup_none'),
      metadata: { pending_action: null, source: 'reply-engine' },
    })
    return
  }

  const sb = getServiceSupabase()
  const asksForAnother = /\b(başka|baska|another|other|daha)\b/i.test(args.inboundText)
  const { data: appts } = await sb
    .from('appointments')
    .select('starts_at, status, service:services(name)')
    .eq('tenant_id', args.tenantId)
    .eq('customer_id', args.customerId)
    .in('status', ['scheduled', 'confirmed', 'rescheduled'])
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(2)

  const chosen = asksForAnother ? appts?.[1] : appts?.[0]
  if (!chosen) {
    await sendAndRecord({
      tenantId: args.tenantId,
      customerId: args.customerId,
      toPlus: args.customerPhoneE164,
      locale,
      text: t(locale, 'appointment_lookup_none'),
      metadata: { pending_action: null, source: 'reply-engine' },
    })
    return
  }

  const when = new Date(chosen.starts_at).toLocaleString(locale, {
    timeZone: args.tenantTimezone,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
  const serviceName =
    Array.isArray((chosen as any).service)
      ? ((chosen as any).service[0]?.name ?? 'appointment')
      : ((chosen as any).service?.name ?? 'appointment')

  await sendAndRecord({
    tenantId: args.tenantId,
    customerId: args.customerId,
    toPlus: args.customerPhoneE164,
    locale,
    text: t(locale, 'appointment_lookup_found', {
      service: serviceName,
      when,
    }),
    metadata: { pending_action: null, source: 'reply-engine' },
  })
}

async function answerAppointmentList(args: HandleInboundArgs, locale: LocaleCode): Promise<void> {
  if (!args.customerId) {
    await sendAndRecord({
      tenantId: args.tenantId,
      customerId: args.customerId,
      toPlus: args.customerPhoneE164,
      locale,
      text: t(locale, 'appointment_list_none'),
      metadata: { pending_action: null, source: 'reply-engine' },
    })
    return
  }

  const sb = getServiceSupabase()
  const week = computeCurrentWeekBounds(args.tenantTimezone)
  const { data: appts } = await sb
    .from('appointments')
    .select('starts_at, service:services(name)')
    .eq('tenant_id', args.tenantId)
    .eq('customer_id', args.customerId)
    .in('status', ['scheduled', 'confirmed', 'rescheduled'])
    .gte('starts_at', week.fromISO)
    .lt('starts_at', week.toISO)
    .order('starts_at', { ascending: true })
    .limit(10)

  if (!appts || appts.length === 0) {
    await sendAndRecord({
      tenantId: args.tenantId,
      customerId: args.customerId,
      toPlus: args.customerPhoneE164,
      locale,
      text: t(locale, 'appointment_list_none'),
      metadata: { pending_action: null, source: 'reply-engine' },
    })
    return
  }

  const items = appts
    .map((appt: any) => {
      const service = Array.isArray(appt.service)
        ? (appt.service[0]?.name ?? 'appointment')
        : (appt.service?.name ?? 'appointment')
      return `${service} (${formatDateTimeForHumans(appt.starts_at, args.tenantTimezone, locale)})`
    })
    .join(' · ')

  await sendAndRecord({
    tenantId: args.tenantId,
    customerId: args.customerId,
    toPlus: args.customerPhoneE164,
    locale,
    text: t(locale, 'appointment_list_found', { items }),
    metadata: { pending_action: null, source: 'reply-engine' },
  })
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
      customerId: args.customerId,
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
  const tz = args.tenantTimezone

  // Did the customer mention a specific day?  ("perşembe", "tomorrow", …)
  const hint = parseDayHint(args.inboundText)
  const bounds = hint ? computeDayBounds(hint, tz) : null

  // Did they also name a specific time? ("15:00", "3pm", "saat 15")
  const timeHint = extractTimeHint(args.inboundText)
  const multiHours = extractMultipleHourHints(args.inboundText)

  // Case -1: user asks to reserve/check two+ explicit times in one message.
  // Example: "cuma 16 ve cuma 15 için 2 randevu alabilir miyim"
  if (bounds && multiHours.length >= 2) {
    const requestedSlots = multiHours.slice(0, 3).map(hm => {
      const startsAt = tzLocalToUtcISO(bounds.targetYMD, hm.hour, hm.minute, tz)
      const endsAt = new Date(
        new Date(startsAt).getTime() + service.duration_minutes * 60_000,
      ).toISOString()
      return { startsAt, endsAt, label: `${String(hm.hour).padStart(2, '0')}:${String(hm.minute).padStart(2, '0')}` }
    })

    const available: { startsAt: string; endsAt: string; label: string }[] = []
    for (const rs of requestedSlots) {
      const free = await isSlotAvailable({
        tenantId: args.tenantId,
        startsAt: rs.startsAt,
        endsAt: rs.endsAt,
      })
      if (free) available.push(rs)
    }

    if (available.length > 0) {
      const dayLabel = weekdayLabel(bounds.fromISO, tz, locale)
      const times = available.map(a => a.label).join(', ')
      const text =
        locale === 'tr'
          ? `${dayLabel} için şu saatler uygun: ${times}. Hepsini onaylamak için EVET yazın veya saatleri numarayla seçin.`
          : `These times are available on ${dayLabel}: ${times}. Reply YES to confirm all or pick by number.`
      await sendAndRecord({
        tenantId: args.tenantId,
        customerId: args.customerId,
        toPlus: args.customerPhoneE164,
        locale,
        text,
        metadata: {
          pending_action: 'slot_choice',
          slot_candidates: available.map(a => ({ startsAt: a.startsAt, endsAt: a.endsAt })),
          service_id: service.id,
          confirm_all: true,
          source: 'reply-engine',
        },
      })
      return
    }
  }

  // --- Case 0: day + time given → check that exact slot on the calendar.
  // We do this BEFORE the generic day-scan so "cuma 15:00 müsait mi?" can
  // get a direct yes/no instead of the three default morning slots.
  if (bounds && timeHint) {
    const startsAt = tzLocalToUtcISO(
      bounds.targetYMD,
      timeHint.hour,
      timeHint.minute,
      tz,
    )
    const endsAt = new Date(
      new Date(startsAt).getTime() + service.duration_minutes * 60_000,
    ).toISOString()

    const free = await isSlotAvailable({
      tenantId: args.tenantId,
      startsAt,
      endsAt,
    })

    const dayLabel = weekdayLabel(bounds.fromISO, tz, locale)
    const timeLabel = `${String(timeHint.hour).padStart(2, '0')}:${String(timeHint.minute).padStart(2, '0')}`

    if (free) {
      await sendAndRecord({
        tenantId: args.tenantId,
        customerId: args.customerId,
        toPlus: args.customerPhoneE164,
        locale,
        text: t(locale, 'specific_time_available', { day: dayLabel, time: timeLabel }),
        metadata: {
          pending_action: 'slot_choice',
          slot_candidates: [{ startsAt, endsAt }],
          service_id: service.id,
          source: 'reply-engine',
        },
      })
      return
    }

    // Not free → offer closest alternatives (on the same day first, then any day).
    const sameDayAlts = await suggestOpenSlots({
      tenantId: args.tenantId,
      durationMinutes: service.duration_minutes,
      targetWindow: { fromISO: bounds.fromISO, toISO: bounds.toISO },
    })
    const alts =
      sameDayAlts.length > 0
        ? sameDayAlts
        : await suggestOpenSlots({
            tenantId: args.tenantId,
            durationMinutes: service.duration_minutes,
            lookaheadDays: 7,
          })

    if (alts.length === 0) {
      await sendAndRecord({
        tenantId: args.tenantId,
        customerId: args.customerId,
        toPlus: args.customerPhoneE164,
        locale,
        text: t(locale, 'fallback'),
        metadata: { pending_action: null, source: 'reply-engine' },
      })
      return
    }

    const pretty = alts
      .map((s, i) => `${i + 1}) ${formatSlotForHumans(s.startsAt, tz, locale)}`)
      .join('  ·  ')
    await sendAndRecord({
      tenantId: args.tenantId,
      customerId: args.customerId,
      toPlus: args.customerPhoneE164,
      locale,
      text: t(locale, 'specific_time_taken', {
        day: dayLabel,
        time: timeLabel,
        slots: pretty,
      }),
      metadata: {
        pending_action: 'slot_choice',
        slot_candidates: alts,
        service_id: service.id,
        source: 'reply-engine',
      },
    })
    return
  }

  // Slots scoped to the requested day (if any), plus a fallback scan so we
  // can offer alternatives when the requested day is fully booked.
  const targetedSlots = bounds
    ? await suggestOpenSlots({
        tenantId: args.tenantId,
        durationMinutes: service.duration_minutes,
        targetWindow: { fromISO: bounds.fromISO, toISO: bounds.toISO },
      })
    : []

  const fallbackSlots = await suggestOpenSlots({
    tenantId: args.tenantId,
    durationMinutes: service.duration_minutes,
    lookaheadDays: 7,
  })

  // --- Decide which message to send ---

  // Case 1: user specified a day and we found openings on it.
  if (bounds && targetedSlots.length > 0) {
    const pretty = targetedSlots
      .map((s, i) => `${i + 1}) ${formatSlotForHumans(s.startsAt, tz, locale)}`)
      .join('  ·  ')
    const dayLabel = weekdayLabel(bounds.fromISO, tz, locale)
    await sendAndRecord({
      tenantId: args.tenantId,
      customerId: args.customerId,
      toPlus: args.customerPhoneE164,
      locale,
      text: t(locale, 'ask_time_on_day', { day: dayLabel, slots: pretty }),
      metadata: {
        pending_action: 'slot_choice',
        slot_candidates: targetedSlots,
        service_id: service.id,
        source: 'reply-engine',
      },
    })
    return
  }

  // Case 2: user specified a day but it's full → apologise + offer alternatives.
  if (bounds && targetedSlots.length === 0 && fallbackSlots.length > 0) {
    const pretty = fallbackSlots
      .map((s, i) => `${i + 1}) ${formatSlotForHumans(s.startsAt, tz, locale)}`)
      .join('  ·  ')
    const dayLabel = weekdayLabel(bounds.fromISO, tz, locale)
    await sendAndRecord({
      tenantId: args.tenantId,
      customerId: args.customerId,
      toPlus: args.customerPhoneE164,
      locale,
      text: t(locale, 'no_slots_on_day', { day: dayLabel, slots: pretty }),
      metadata: {
        pending_action: 'slot_choice',
        slot_candidates: fallbackSlots,
        service_id: service.id,
        source: 'reply-engine',
      },
    })
    return
  }

  // Case 3: no day specified — classic "next 3 open slots" experience.
  if (!bounds && fallbackSlots.length > 0) {
    const pretty = fallbackSlots
      .map((s, i) => `${i + 1}) ${formatSlotForHumans(s.startsAt, tz, locale)}`)
      .join('  ·  ')
    await sendAndRecord({
      tenantId: args.tenantId,
      customerId: args.customerId,
      toPlus: args.customerPhoneE164,
      locale,
      text: t(locale, 'ask_time', { slots: pretty }),
      metadata: {
        pending_action: 'slot_choice',
        slot_candidates: fallbackSlots,
        service_id: service.id,
        source: 'reply-engine',
      },
    })
    return
  }

  // Case 4: nothing open anywhere in the lookahead window.
  await sendAndRecord({
    tenantId: args.tenantId,
    customerId: args.customerId,
    toPlus: args.customerPhoneE164,
    locale,
    text: t(locale, 'fallback'),
    metadata: { pending_action: null, source: 'reply-engine' },
  })
}

async function bookSelectedSlot(
  args: HandleInboundArgs,
  slot: { startsAt: string; endsAt: string },
  serviceId: string | null,
): Promise<void> {
  const locale = args.customerLocale ?? args.tenantLocale
  if (!serviceId) {
    // No service locked in from prior turn — re-offer slots instead of silently failing.
    await offerSlotsForBooking(args, locale)
    return
  }
  try {
    await createBooking({
      tenantId: args.tenantId,
      serviceId,
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
      customerPhoneE164: args.customerPhoneE164,
      locale,
      channel: 'bot',
    })
    // createBooking already sends the confirmation WhatsApp; we still
    // record the outbound in our own log so state is consistent.
    await recordOutboundStub({
      tenantId: args.tenantId,
      customerId: args.customerId,
      metadata: { pending_action: null, source: 'reply-engine' },
    })
  } catch (err) {
    // Slot collision or calendar error → re-offer slots.
    console.warn('[reply-engine] booking failed, re-offering slots', {
      msg: (err as Error).message,
    })
    await offerSlotsForBooking(args, locale)
  }
}

async function offerCancellation(args: HandleInboundArgs, locale: LocaleCode): Promise<void> {
  if (!args.customerId) {
    await sendAndRecord({
      tenantId: args.tenantId,
      customerId: args.customerId,
      toPlus: args.customerPhoneE164,
      locale,
      text: t(locale, 'fallback'),
      metadata: { pending_action: null, source: 'reply-engine' },
    })
    return
  }

  const sb = getServiceSupabase()
  const dayHint = parseDayHint(args.inboundText)
  const wantsPlural = /\b(randevularımı|randevularimi|appointments|all|hepsini|tümünü|tumunu)\b/i.test(args.inboundText)
  if (dayHint && wantsPlural) {
    const bounds = computeDayBounds(dayHint, args.tenantTimezone)
    const dayLabel = weekdayLabel(bounds.fromISO, args.tenantTimezone, locale)
    const { data: appts } = await sb
      .from('appointments')
      .select('id, starts_at, service:services(name)')
      .eq('tenant_id', args.tenantId)
      .eq('customer_id', args.customerId)
      .in('status', ['scheduled', 'confirmed', 'rescheduled'])
      .gte('starts_at', bounds.fromISO)
      .lt('starts_at', bounds.toISO)
      .order('starts_at', { ascending: true })

    if (!appts || appts.length === 0) {
      await sendAndRecord({
        tenantId: args.tenantId,
        customerId: args.customerId,
        toPlus: args.customerPhoneE164,
        locale,
        text: t(locale, 'cancel_day_none', { day: dayLabel }),
        metadata: { pending_action: null, source: 'reply-engine' },
      })
      return
    }

    for (const appt of appts as any[]) {
      await cancelBooking(appt.id, undefined, locale, false)
    }

    const items = (appts as any[])
      .map(appt => formatDateTimeForHumans(appt.starts_at, args.tenantTimezone, locale))
      .join(' · ')

    await sendAndRecord({
      tenantId: args.tenantId,
      customerId: args.customerId,
      toPlus: args.customerPhoneE164,
      locale,
      text: t(locale, 'cancel_day_found', {
        day: dayLabel,
        count: appts.length,
        items,
      }),
      metadata: { pending_action: null, source: 'reply-engine' },
    })
    return
  }

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
      customerId: args.customerId,
      toPlus: args.customerPhoneE164,
      locale,
      text: t(locale, 'fallback'),
      metadata: { pending_action: null, source: 'reply-engine' },
    })
    return
  }

  // Single-turn cancel: do it now, notification will be sent by cancelBooking().
  await cancelBooking(appt.id, undefined, locale)
  await recordOutboundStub({
    tenantId: args.tenantId,
    customerId: args.customerId,
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

  const tz = args.tenantTimezone
  const hint = parseDayHint(args.inboundText)
  const bounds = hint ? computeDayBounds(hint, tz) : null

  const targetedSlots = bounds
    ? await suggestOpenSlots({
        tenantId: args.tenantId,
        durationMinutes: appt.service.duration_minutes,
        targetWindow: { fromISO: bounds.fromISO, toISO: bounds.toISO },
      })
    : []

  const fallbackSlots = await suggestOpenSlots({
    tenantId: args.tenantId,
    durationMinutes: appt.service.duration_minutes,
    lookaheadDays: 7,
  })

  const chosenSlots =
    bounds && targetedSlots.length > 0 ? targetedSlots : fallbackSlots
  if (chosenSlots.length === 0) {
    await unknownFallback(args, locale)
    return
  }

  const pretty = chosenSlots
    .map((s, i) => `${i + 1}) ${formatSlotForHumans(s.startsAt, tz, locale)}`)
    .join('  ·  ')

  let textBody: string
  if (bounds && targetedSlots.length > 0) {
    textBody = t(locale, 'ask_time_on_day', {
      day: weekdayLabel(bounds.fromISO, tz, locale),
      slots: pretty,
    })
  } else if (bounds && targetedSlots.length === 0) {
    textBody = t(locale, 'no_slots_on_day', {
      day: weekdayLabel(bounds.fromISO, tz, locale),
      slots: pretty,
    })
  } else {
    textBody = t(locale, 'ask_time', { slots: pretty })
  }

  await sendAndRecord({
    tenantId: args.tenantId,
    customerId: args.customerId,
    toPlus: args.customerPhoneE164,
    locale,
    text: textBody,
    metadata: {
      pending_action: 'reschedule_slot_choice',
      slot_candidates: chosenSlots,
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
  const locale = args.customerLocale ?? args.tenantLocale
  try {
    await rescheduleBooking({
      appointmentId,
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
    })
  } catch (err) {
    console.warn('[reply-engine] reschedule failed', { msg: (err as Error).message })
    await unknownFallback(args, locale)
    return
  }
  await sendAndRecord({
    tenantId: args.tenantId,
    customerId: args.customerId,
    toPlus: args.customerPhoneE164,
    locale,
    text: t(locale, 'booking_rescheduled', {
      service: '',
      when: formatSlotForHumans(slot.startsAt, args.tenantTimezone, locale),
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
    customerId: args.customerId,
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
  confirm_all?: boolean
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
    confirm_all: md.confirm_all ?? false,
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

function pickSlots(
  text: string,
  slots: { startsAt: string; endsAt: string }[],
): { startsAt: string; endsAt: string }[] {
  if (slots.length === 0) return []
  const trimmed = text.trim().toLowerCase()

  // Multi numeric picks: "1 ve 2", "1,2", "1 and 2"
  const nums = [...trimmed.matchAll(/\b([1-9])\b/g)]
    .map(m => Number(m[1]) - 1)
    .filter(i => i >= 0 && i < slots.length)
  if (nums.length >= 2) {
    return [...new Set(nums)].map(i => slots[i])
  }

  // "both / ikisi / ikisini / hepsi" selects all currently offered slots.
  if (isMultiConfirm(trimmed)) {
    return slots
  }

  const one = pickSlot(text, slots)
  return one ? [one] : []
}

function isMultiConfirm(text: string): boolean {
  return /\b(ikisi|ikisini|ikiside|ikisini\s+de|ikisini\s+da|both|all|hepsi|tümü|tumunu|tumunu)\b/i.test(text)
}

function extractMultipleHourHints(text: string): Array<{ hour: number; minute: number }> {
  const out: Array<{ hour: number; minute: number }> = []
  // Capture times with optional minutes in messages containing connectors.
  if (!/\b(ve|and|ile|,&|,)\b/i.test(text)) return out

  for (const m of text.matchAll(/\b([01]?\d|2[0-3])(?::([0-5]\d))?\b/g)) {
    const raw = m[0]
    const idx = m.index ?? 0
    const tail = text.slice(idx, idx + 16).toLowerCase()
    // Skip counters like "2 randevu".
    if (/\b\d+\s+randevu/.test(tail)) continue
    const hour = Number(m[1])
    const minute = Number(m[2] ?? '0')
    if (hour >= 0 && hour <= 23) out.push({ hour, minute })
    if (raw.length === 1 && !/\b(saat|:|\.|pm|am|akşam|aksam|öğleden|ogleden)\b/i.test(text)) {
      // Bare single digit without time context is likely an index.
      out.pop()
    }
  }
  return out.filter((v, i, arr) =>
    arr.findIndex(x => x.hour === v.hour && x.minute === v.minute) === i,
  )
}

async function getRecentPendingSlots(
  tenantId: string,
  customerId: string | null,
): Promise<Array<{ slot: { startsAt: string; endsAt: string }; serviceId: string | null }>> {
  if (!customerId) return []
  const sb = getServiceSupabase()
  const since = new Date(Date.now() - 30 * 60_000).toISOString()
  const { data } = await sb
    .from('conversations')
    .select('metadata, created_at')
    .eq('tenant_id', tenantId)
    .eq('customer_id', customerId)
    .eq('direction', 'outbound')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(6)

  const result: Array<{ slot: { startsAt: string; endsAt: string }; serviceId: string | null }> = []
  const seen = new Set<string>()
  for (const row of data ?? []) {
    const md = (row as any).metadata as OutboundMetadata | undefined
    if (!md || md.pending_action !== 'slot_choice') continue
    for (const s of md.slot_candidates ?? []) {
      const key = `${s.startsAt}-${s.endsAt}`
      if (seen.has(key)) continue
      seen.add(key)
      result.push({ slot: s, serviceId: md.service_id ?? null })
    }
  }
  return result
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

function formatDateTimeForHumans(iso: string, tz: string | null, locale: LocaleCode): string {
  const d = new Date(iso)
  try {
    return d.toLocaleString(locale, {
      timeZone: tz ?? 'UTC',
      weekday: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return d.toISOString()
  }
}

function looksLikeAvailabilityMessage(text: string): boolean {
  const t = text.toLowerCase()
  return /\b(müsait(?:lik)?|musait(?:lik)?|uygun(?:luk)?|boş(?:luk)?|bos(?:luk)?|açık(?:lık)?|acik(?:lik)?|mevcut|available|free|open|slot|slots)\b/i.test(t)
}

interface SendAndRecordArgs {
  tenantId: string
  customerId: string | null                   // needed so the NEXT turn can read pending state
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
  const { error: convErr } = await sb.from('conversations').insert({
    tenant_id: a.tenantId,
    customer_id: a.customerId,
    wa_message_id: waMessageId || null,
    direction: 'outbound',
    channel: 'whatsapp',
    message_text: a.text,
    message_type: 'text',
    language: a.locale,
    metadata: a.metadata,
  })
  if (convErr) {
    console.error('[reply-engine] outbound conversation insert failed', {
      err: convErr.message,
      code: convErr.code,
      tenantId: a.tenantId,
      customerId: a.customerId,
    })
  }
}

// Used when the outbound text itself was sent by another helper
// (e.g. createBooking emits the confirmation). We still stamp an audit
// row so pending_action is reset to null.
async function recordOutboundStub(a: {
  tenantId: string
  customerId: string | null
  metadata: OutboundMetadata
}): Promise<void> {
  const sb = getServiceSupabase()
  await sb.from('conversations').insert({
    tenant_id: a.tenantId,
    customer_id: a.customerId,
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
              `You are a warm, concise WhatsApp assistant for a small service business.`,
              // Language discipline — this MUST be respected verbatim.
              `CRITICAL: Reply in the SAME LANGUAGE as the user's last message.`,
              `Do not translate or switch languages, even if the business context is in English.`,
              `If the user writes in Turkish, answer in Turkish. If in Spanish, answer in Spanish. Etc.`,
              `Best-guess locale code for the user's language: ${args.locale}.`,
              // Scope.
              `You ONLY answer general questions (hours, services, location chit-chat). You do NOT offer or confirm appointments yourself — the surrounding system does that automatically when the user asks about booking, a specific day, or a specific time.`,
              `Therefore: NEVER instruct the user to "reply book", "reply cancel", or "reply reschedule". They can ask naturally ("cuma 15:00 müsait mi?", "randevu istiyorum") and the system will handle it.`,
              // Safety rails.
              `Reply in 1–2 short sentences. Do NOT invent times, prices, services, or addresses that aren't in the business context below.`,
              `If you don't know something specific (e.g. exact price), say you'll check and invite the user to ask for a booking day/time.`,
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
