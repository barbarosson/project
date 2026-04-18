import { getServiceSupabase } from './supabase'
import { recordUsage } from './cost'
import {
  createEvent, updateEvent, deleteEvent, listBusySlots, proposeSlots,
  type CalendarSlot,
} from './google-calendar'
import { sendText } from './whatsapp'
import { t } from './i18n'
import type { LocaleCode, Tenant } from './types'

interface CreateBookingArgs {
  tenantId: string
  serviceId: string
  startsAt: string
  endsAt: string
  customerName?: string
  customerPhoneE164: string
  customerEmail?: string
  locale?: LocaleCode
  channel?: 'bot' | 'manual' | 'webform' | 'api'
  notes?: string
}

export async function createBooking(args: CreateBookingArgs) {
  const sb = getServiceSupabase()

  const { data: tenant, error: tErr } = await sb
    .from('tenants')
    .select('id, business_name, timezone, default_locale, default_currency')
    .eq('id', args.tenantId)
    .maybeSingle()
  if (tErr) throw tErr
  if (!tenant) throw new Error(`Tenant not found: ${args.tenantId}`)

  const { data: service } = await sb
    .from('services')
    .select('id, name, duration_minutes')
    .eq('id', args.serviceId)
    .eq('tenant_id', args.tenantId)
    .maybeSingle()
  if (!service) throw new Error(`Service not found: ${args.serviceId}`)

  // Upsert customer.
  const { data: existingCustomer } = await sb
    .from('customers')
    .select('id')
    .eq('tenant_id', args.tenantId)
    .eq('phone_e164', args.customerPhoneE164)
    .maybeSingle()

  let customerId = existingCustomer?.id
  if (!customerId) {
    const { data: inserted, error: cErr } = await sb
      .from('customers')
      .insert({
        tenant_id: args.tenantId,
        full_name: args.customerName ?? null,
        phone_e164: args.customerPhoneE164,
        email: args.customerEmail ?? null,
        preferred_locale: args.locale ?? tenant.default_locale,
      })
      .select('id')
      .single()
    if (cErr) throw cErr
    customerId = inserted.id
  }

  // Conflict check: do we already hold that slot?
  const { data: conflict } = await sb
    .from('appointments')
    .select('id')
    .eq('tenant_id', args.tenantId)
    .in('status', ['scheduled', 'confirmed'])
    .lt('starts_at', args.endsAt)
    .gt('ends_at', args.startsAt)
    .maybeSingle()
  if (conflict) throw new Error('Time slot already booked')

  // Push to Google Calendar (best-effort: tolerate no connection).
  let googleEventId: string | null = null
  try {
    const { eventId } = await createEvent({
      tenantId: args.tenantId,
      summary: `${service.name} — ${args.customerName ?? args.customerPhoneE164}`,
      description: args.notes,
      startsAt: args.startsAt,
      endsAt: args.endsAt,
      attendeeEmail: args.customerEmail,
      attendeePhone: args.customerPhoneE164,
      timeZone: tenant.timezone,
    })
    googleEventId = eventId
  } catch (err) {
    console.warn('[apptflow] google calendar insert skipped:', (err as Error).message)
  }

  const { data: inserted, error: aErr } = await sb
    .from('appointments')
    .insert({
      tenant_id: args.tenantId,
      customer_id: customerId,
      service_id: service.id,
      starts_at: args.startsAt,
      ends_at: args.endsAt,
      status: 'scheduled',
      booking_channel: args.channel ?? 'bot',
      google_event_id: googleEventId,
      notes: args.notes ?? null,
    })
    .select('*')
    .single()
  if (aErr) throw aErr

  await recordUsage(args.tenantId, 'appointment.created', 1)

  // Fire confirmation WhatsApp (best-effort).
  try {
    await sendText({
      tenantId: args.tenantId,
      to: args.customerPhoneE164.replace(/^\+/, ''),
      text: t(args.locale ?? tenant.default_locale, 'booking_confirmed', {
        service: service.name,
        when: new Date(args.startsAt).toLocaleString(args.locale ?? tenant.default_locale, {
          timeZone: tenant.timezone,
        }),
      }),
    })
    await sb.from('appointments').update({ confirmation_sent: true }).eq('id', inserted.id)
  } catch (err) {
    console.warn('[apptflow] booking confirmation message skipped:', (err as Error).message)
  }

  return inserted
}

export async function cancelBooking(appointmentId: string, reason?: string) {
  const sb = getServiceSupabase()
  const { data: appt } = await sb
    .from('appointments')
    .select('id, tenant_id, google_event_id, customer_id, starts_at, service_id')
    .eq('id', appointmentId)
    .maybeSingle()
  if (!appt) throw new Error(`Appointment not found: ${appointmentId}`)

  if (appt.google_event_id) {
    try {
      await deleteEvent({ tenantId: appt.tenant_id, eventId: appt.google_event_id })
    } catch (err) {
      console.warn('[apptflow] google calendar delete skipped:', (err as Error).message)
    }
  }

  const { error } = await sb
    .from('appointments')
    .update({ status: 'cancelled', cancelled_reason: reason ?? null })
    .eq('id', appointmentId)
  if (error) throw error

  // Notify customer.
  try {
    const { data: enriched } = await sb
      .from('appointments')
      .select(`
        starts_at, tenant:tenants(business_name, timezone, default_locale),
        customer:customers(phone_e164, preferred_locale),
        service:services(name)
      `)
      .eq('id', appointmentId)
      .single<any>()
    if (enriched?.customer?.phone_e164) {
      const locale = enriched.customer.preferred_locale ?? enriched.tenant.default_locale
      await sendText({
        tenantId: appt.tenant_id,
        to: enriched.customer.phone_e164.replace(/^\+/, ''),
        text: t(locale, 'booking_cancelled', {
          service: enriched.service?.name ?? 'appointment',
          when: new Date(enriched.starts_at).toLocaleString(locale, {
            timeZone: enriched.tenant.timezone,
          }),
        }),
      })
    }
  } catch (err) {
    console.warn('[apptflow] cancellation notify skipped:', (err as Error).message)
  }
}

export async function rescheduleBooking(args: {
  appointmentId: string
  startsAt: string
  endsAt: string
}) {
  const sb = getServiceSupabase()
  const { data: appt } = await sb
    .from('appointments')
    .select('id, tenant_id, google_event_id')
    .eq('id', args.appointmentId)
    .maybeSingle()
  if (!appt) throw new Error(`Appointment not found: ${args.appointmentId}`)

  const { data: tenant } = await sb
    .from('tenants')
    .select('timezone')
    .eq('id', appt.tenant_id)
    .maybeSingle()

  if (appt.google_event_id && tenant) {
    try {
      await updateEvent({
        tenantId: appt.tenant_id,
        eventId: appt.google_event_id,
        startsAt: args.startsAt,
        endsAt: args.endsAt,
        timeZone: tenant.timezone,
      })
    } catch (err) {
      console.warn('[apptflow] google calendar patch skipped:', (err as Error).message)
    }
  }

  const { error } = await sb
    .from('appointments')
    .update({
      starts_at: args.startsAt,
      ends_at: args.endsAt,
      status: 'rescheduled',
    })
    .eq('id', args.appointmentId)
  if (error) throw error
}

// Used by the messaging agent to offer slots to a customer.
export async function suggestOpenSlots(args: {
  tenantId: string
  durationMinutes: number
  lookaheadDays?: number
}): Promise<CalendarSlot[]> {
  const from = new Date()
  const to = new Date(from.getTime() + (args.lookaheadDays ?? 7) * 86_400_000)
  let busy: CalendarSlot[] = []
  try {
    busy = await listBusySlots(args.tenantId, from, to)
  } catch {
    // No calendar connection yet — fall back to local appointments.
    const sb = getServiceSupabase()
    const { data } = await sb
      .from('appointments')
      .select('starts_at, ends_at')
      .eq('tenant_id', args.tenantId)
      .in('status', ['scheduled', 'confirmed'])
      .gte('starts_at', from.toISOString())
      .lte('ends_at', to.toISOString())
    busy = (data ?? []).map(r => ({ startsAt: r.starts_at, endsAt: r.ends_at }))
  }
  return proposeSlots(busy, from, to, args.durationMinutes)
}
