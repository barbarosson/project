import { NextRequest, NextResponse } from 'next/server'
import { requireCronAuth } from '@/lib/apptflow/cron'
import { getServiceSupabase } from '@/lib/apptflow/supabase'
import { sendText } from '@/lib/apptflow/whatsapp'
import { t } from '@/lib/apptflow/i18n'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Walks every scheduled/confirmed appointment starting in the next 24h
// and sends 24h + 2h reminders idempotently. Safe to call every 5 min.
export async function POST(req: NextRequest) {
  if (!requireCronAuth(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  return runReminders()
}
export async function GET(req: NextRequest) {
  if (!requireCronAuth(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  return runReminders()
}

async function runReminders() {
  const sb = getServiceSupabase()
  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 3600_000)
  const in2h = new Date(now.getTime() + 2 * 3600_000)

  let sent24 = 0
  let sent2 = 0

  // --- 24h reminders (between 23h and 24h ahead, not yet sent) -------
  const { data: due24 } = await sb
    .from('appointments')
    .select(`
      id, tenant_id, starts_at, reminder_sent_24h,
      tenant:tenants(business_name, timezone, default_locale),
      customer:customers(phone_e164, preferred_locale),
      service:services(name)
    `)
    .in('status', ['scheduled', 'confirmed'])
    .eq('reminder_sent_24h', false)
    .gte('starts_at', new Date(in24h.getTime() - 30 * 60_000).toISOString())
    .lte('starts_at', new Date(in24h.getTime() + 30 * 60_000).toISOString())

  for (const row of (due24 ?? []) as any[]) {
    if (!row.customer?.phone_e164) continue
    const locale = row.customer.preferred_locale ?? row.tenant.default_locale
    try {
      await sendText({
        tenantId: row.tenant_id,
        to: row.customer.phone_e164.replace(/^\+/, ''),
        text: t(locale, 'booking_reminder_24h', {
          service: row.service?.name ?? 'appointment',
          time: new Date(row.starts_at).toLocaleTimeString(locale, {
            timeZone: row.tenant.timezone,
            hour: '2-digit', minute: '2-digit',
          }),
        }),
      })
      await sb.from('appointments').update({ reminder_sent_24h: true }).eq('id', row.id)
      sent24++
    } catch (err) {
      console.warn('[apptflow] 24h reminder failed:', (err as Error).message)
    }
  }

  // --- 2h reminders --------------------------------------------------
  const { data: due2 } = await sb
    .from('appointments')
    .select(`
      id, tenant_id, starts_at, reminder_sent_2h,
      tenant:tenants(business_name, timezone, default_locale),
      customer:customers(phone_e164, preferred_locale),
      service:services(name)
    `)
    .in('status', ['scheduled', 'confirmed'])
    .eq('reminder_sent_2h', false)
    .gte('starts_at', new Date(in2h.getTime() - 15 * 60_000).toISOString())
    .lte('starts_at', new Date(in2h.getTime() + 15 * 60_000).toISOString())

  for (const row of (due2 ?? []) as any[]) {
    if (!row.customer?.phone_e164) continue
    const locale = row.customer.preferred_locale ?? row.tenant.default_locale
    try {
      await sendText({
        tenantId: row.tenant_id,
        to: row.customer.phone_e164.replace(/^\+/, ''),
        text: t(locale, 'booking_reminder_2h', {
          service: row.service?.name ?? 'appointment',
          time: new Date(row.starts_at).toLocaleTimeString(locale, {
            timeZone: row.tenant.timezone,
            hour: '2-digit', minute: '2-digit',
          }),
        }),
      })
      await sb.from('appointments').update({ reminder_sent_2h: true }).eq('id', row.id)
      sent2++
    } catch (err) {
      console.warn('[apptflow] 2h reminder failed:', (err as Error).message)
    }
  }

  return NextResponse.json({ ok: true, sent_24h: sent24, sent_2h: sent2 })
}
