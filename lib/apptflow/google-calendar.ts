import { google, calendar_v3 } from 'googleapis'
import { env } from './env'
import { getServiceSupabase } from './supabase'
import { recordUsage } from './cost'

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
  'openid',
  'email',
]

function makeOAuth2Client() {
  return new google.auth.OAuth2(
    env.googleClientId(),
    env.googleClientSecret(),
    env.googleRedirectUri(),
  )
}

export function getAuthUrl(state: string): string {
  const oauth2 = makeOAuth2Client()
  return oauth2.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',                       // force refresh_token on first grant
    scope: SCOPES,
    state,
  })
}

// After the OAuth callback, persist the refresh token so we can make
// calendar calls on behalf of the tenant forever.
export async function handleOAuthCallback(args: {
  tenantId: string
  code: string
}): Promise<void> {
  const oauth2 = makeOAuth2Client()
  const { tokens } = await oauth2.getToken(args.code)

  if (!tokens.refresh_token) {
    throw new Error('Google did not return a refresh_token. User must reconsent with prompt=consent.')
  }

  oauth2.setCredentials(tokens)
  const oauth2Api = google.oauth2({ version: 'v2', auth: oauth2 })
  const userinfo = await oauth2Api.userinfo.get()

  const sb = getServiceSupabase()
  const { error } = await sb.from('calendar_connections').upsert(
    {
      tenant_id: args.tenantId,
      provider: 'google',
      google_account_email: userinfo.data.email ?? null,
      google_calendar_id: 'primary',
      refresh_token: tokens.refresh_token,
      access_token: tokens.access_token ?? null,
      access_token_expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
      scope: tokens.scope ?? SCOPES.join(' '),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'tenant_id' },
  )
  if (error) throw error
}

async function getCalendarForTenant(tenantId: string): Promise<{
  calendar: calendar_v3.Calendar
  calendarId: string
}> {
  const sb = getServiceSupabase()
  const { data, error } = await sb
    .from('calendar_connections')
    .select('refresh_token, google_calendar_id')
    .eq('tenant_id', tenantId)
    .maybeSingle()
  if (error) throw error
  if (!data?.refresh_token) throw new Error(`Tenant ${tenantId} has no Google Calendar connection`)

  const oauth2 = makeOAuth2Client()
  oauth2.setCredentials({ refresh_token: data.refresh_token })

  return {
    calendar: google.calendar({ version: 'v3', auth: oauth2 }),
    calendarId: data.google_calendar_id || 'primary',
  }
}

export interface CalendarSlot {
  startsAt: string
  endsAt: string
}

export async function listBusySlots(
  tenantId: string,
  windowStart: Date,
  windowEnd: Date,
): Promise<CalendarSlot[]> {
  const { calendar, calendarId } = await getCalendarForTenant(tenantId)
  const res = await calendar.freebusy.query({
    requestBody: {
      timeMin: windowStart.toISOString(),
      timeMax: windowEnd.toISOString(),
      items: [{ id: calendarId }],
    },
  })
  await recordUsage(tenantId, 'calendar.sync', 1, { op: 'freebusy' })
  const busy = res.data.calendars?.[calendarId]?.busy ?? []
  return busy
    .filter((b): b is { start: string; end: string } => !!b.start && !!b.end)
    .map(b => ({ startsAt: b.start, endsAt: b.end }))
}

export interface CreateEventArgs {
  tenantId: string
  summary: string
  description?: string
  startsAt: string          // ISO
  endsAt: string            // ISO
  attendeeEmail?: string
  attendeePhone?: string
  timeZone: string
}

export async function createEvent(args: CreateEventArgs): Promise<{ eventId: string }> {
  const { calendar, calendarId } = await getCalendarForTenant(args.tenantId)
  const res = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: args.summary,
      description: args.description,
      start: { dateTime: args.startsAt, timeZone: args.timeZone },
      end: { dateTime: args.endsAt, timeZone: args.timeZone },
      attendees: args.attendeeEmail ? [{ email: args.attendeeEmail }] : undefined,
      reminders: { useDefault: true },
      extendedProperties: {
        private: {
          apptflow: 'true',
          phone: args.attendeePhone ?? '',
        },
      },
    },
  })
  await recordUsage(args.tenantId, 'calendar.sync', 1, { op: 'insert' })
  if (!res.data.id) throw new Error('Google Calendar did not return event id')
  return { eventId: res.data.id }
}

export async function updateEvent(args: {
  tenantId: string
  eventId: string
  startsAt?: string
  endsAt?: string
  timeZone: string
  summary?: string
}): Promise<void> {
  const { calendar, calendarId } = await getCalendarForTenant(args.tenantId)
  await calendar.events.patch({
    calendarId,
    eventId: args.eventId,
    requestBody: {
      summary: args.summary,
      start: args.startsAt ? { dateTime: args.startsAt, timeZone: args.timeZone } : undefined,
      end: args.endsAt ? { dateTime: args.endsAt, timeZone: args.timeZone } : undefined,
    },
  })
  await recordUsage(args.tenantId, 'calendar.sync', 1, { op: 'patch' })
}

export async function deleteEvent(args: {
  tenantId: string
  eventId: string
}): Promise<void> {
  const { calendar, calendarId } = await getCalendarForTenant(args.tenantId)
  await calendar.events.delete({ calendarId, eventId: args.eventId })
  await recordUsage(args.tenantId, 'calendar.sync', 1, { op: 'delete' })
}

// Given the tenant's working window and existing busy slots, return
// the next N open slots of `durationMinutes` length.
export function proposeSlots(
  busy: CalendarSlot[],
  fromTs: Date,
  toTs: Date,
  durationMinutes: number,
  workingHours: { startHour: number; endHour: number } = { startHour: 9, endHour: 18 },
  maxSlots = 3,
): CalendarSlot[] {
  const slots: CalendarSlot[] = []
  const busyRanges = busy
    .map(b => ({ s: +new Date(b.startsAt), e: +new Date(b.endsAt) }))
    .sort((a, b) => a.s - b.s)

  const cursor = new Date(fromTs)
  cursor.setMinutes(0, 0, 0)

  while (slots.length < maxSlots && cursor < toTs) {
    const hour = cursor.getUTCHours()
    if (hour < workingHours.startHour || hour >= workingHours.endHour) {
      cursor.setUTCHours(workingHours.startHour, 0, 0, 0)
      if (hour >= workingHours.endHour) cursor.setUTCDate(cursor.getUTCDate() + 1)
      continue
    }
    const s = +cursor
    const e = s + durationMinutes * 60_000
    const overlap = busyRanges.some(b => !(e <= b.s || s >= b.e))
    if (!overlap) {
      slots.push({
        startsAt: new Date(s).toISOString(),
        endsAt: new Date(e).toISOString(),
      })
    }
    cursor.setUTCMinutes(cursor.getUTCMinutes() + 30)
  }
  return slots
}
