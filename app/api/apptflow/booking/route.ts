import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createBooking, cancelBooking, rescheduleBooking, suggestOpenSlots } from '@/lib/apptflow/booking'
import { dispatchEvent } from '@/lib/apptflow/orchestrator'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const createSchema = z.object({
  tenant_id: z.string().uuid(),
  service_id: z.string().uuid(),
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
  customer_phone_e164: z.string().regex(/^\+?[1-9]\d{6,15}$/),
  customer_name: z.string().optional(),
  customer_email: z.string().email().optional(),
  locale: z.string().length(2).optional().or(z.string().length(5).optional()),
  notes: z.string().max(2000).optional(),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'invalid_payload', details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const appt = await createBooking({
      tenantId: parsed.data.tenant_id,
      serviceId: parsed.data.service_id,
      startsAt: parsed.data.starts_at,
      endsAt: parsed.data.ends_at,
      customerPhoneE164: parsed.data.customer_phone_e164.startsWith('+')
        ? parsed.data.customer_phone_e164
        : `+${parsed.data.customer_phone_e164}`,
      customerName: parsed.data.customer_name,
      customerEmail: parsed.data.customer_email,
      locale: parsed.data.locale as any,
      channel: 'webform',
      notes: parsed.data.notes,
    })
    await dispatchEvent({
      event: 'appointment.created',
      tenant_id: parsed.data.tenant_id,
      payload: { appointment_id: appt.id },
    })
    return NextResponse.json({ ok: true, appointment: appt })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: 'booking_failed', message: (err as Error).message },
      { status: 409 },
    )
  }
}

const patchSchema = z.object({
  appointment_id: z.string().uuid(),
  action: z.enum(['cancel', 'reschedule']),
  reason: z.string().max(500).optional(),
  starts_at: z.string().datetime().optional(),
  ends_at: z.string().datetime().optional(),
})

export async function PATCH(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'invalid_payload' }, { status: 400 })
  }

  try {
    if (parsed.data.action === 'cancel') {
      await cancelBooking(parsed.data.appointment_id, parsed.data.reason)
      await dispatchEvent({
        event: 'appointment.cancelled',
        tenant_id: null,
        payload: { appointment_id: parsed.data.appointment_id, reason: parsed.data.reason },
      })
    } else {
      if (!parsed.data.starts_at || !parsed.data.ends_at) {
        return NextResponse.json({ ok: false, error: 'missing_time' }, { status: 400 })
      }
      await rescheduleBooking({
        appointmentId: parsed.data.appointment_id,
        startsAt: parsed.data.starts_at,
        endsAt: parsed.data.ends_at,
      })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: 'update_failed', message: (err as Error).message },
      { status: 409 },
    )
  }
}

// GET /api/apptflow/booking?tenant_id=..&duration=30 → propose slots
export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenant_id')
  const duration = Number(req.nextUrl.searchParams.get('duration') ?? 30)
  if (!tenantId) {
    return NextResponse.json({ ok: false, error: 'missing_tenant_id' }, { status: 400 })
  }
  const slots = await suggestOpenSlots({
    tenantId,
    durationMinutes: Number.isFinite(duration) && duration > 0 ? duration : 30,
  })
  return NextResponse.json({ ok: true, slots })
}
