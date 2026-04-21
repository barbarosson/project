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

// Given the tenant's weekly windows (in *tenant-local* time) and existing
// busy slots, return the next N open slots of `durationMinutes` length.
// The iteration steps through each local day in `tz`, consults the windows
// defined for that weekday, and walks in 15-minute increments.
//
// When windows are omitted we fall back to Mon–Sat 09:00–18:00 to preserve
// previous default behaviour.
export interface ProposeSlotsOptions {
  durationMinutes: number
  bufferMinutes?: number
  maxSlots?: number
  tz?: string                     // tenant timezone (e.g. "Europe/Istanbul")
  windows?: Array<{ weekday: number; startMin: number; endMin: number }>
  stepMinutes?: number
}

export function proposeSlots(
  busy: CalendarSlot[],
  fromTs: Date,
  toTs: Date,
  durationOrOpts: number | ProposeSlotsOptions,
  legacyWorkingHours?: { startHour: number; endHour: number },
  legacyMaxSlots?: number,
): CalendarSlot[] {
  const opts: ProposeSlotsOptions = typeof durationOrOpts === 'number'
    ? {
        durationMinutes: durationOrOpts,
        maxSlots: legacyMaxSlots ?? 3,
        windows: legacyWorkingHours
          ? [1, 2, 3, 4, 5, 6].map(wd => ({
              weekday: wd,
              startMin: legacyWorkingHours.startHour * 60,
              endMin: legacyWorkingHours.endHour * 60,
            }))
          : undefined,
      }
    : durationOrOpts

  const maxSlots = opts.maxSlots ?? 3
  const step = opts.stepMinutes ?? 15
  const duration = opts.durationMinutes
  const buffer = opts.bufferMinutes ?? 0
  const tz = opts.tz ?? 'UTC'
  const windows =
    opts.windows && opts.windows.length > 0
      ? opts.windows
      : [1, 2, 3, 4, 5, 6].map(wd => ({ weekday: wd, startMin: 9 * 60, endMin: 18 * 60 }))

  const windowsByWd: Record<number, Array<{ startMin: number; endMin: number }>> = {}
  for (const w of windows) {
    (windowsByWd[w.weekday] ||= []).push({ startMin: w.startMin, endMin: w.endMin })
  }
  for (const k of Object.keys(windowsByWd)) {
    windowsByWd[Number(k)].sort((a, b) => a.startMin - b.startMin)
  }

  const busyRanges = busy
    .map(b => ({ s: +new Date(b.startsAt), e: +new Date(b.endsAt) }))
    .sort((a, b) => a.s - b.s)

  const slots: CalendarSlot[] = []

  // Walk day by day in the tenant timezone.
  let dayCursor = new Date(fromTs.getTime())
  while (slots.length < maxSlots && dayCursor < toTs) {
    const localDay = localYMDW(dayCursor, tz)
    const dayWindows = windowsByWd[localDay.weekday] ?? []

    for (const win of dayWindows) {
      // Iterate slot start times within [startMin, endMin - duration].
      for (
        let m = win.startMin;
        m + duration <= win.endMin;
        m += step
      ) {
        const startLocalMs = tzLocalDateToUtcMs(localDay.y, localDay.mo, localDay.d, Math.floor(m / 60), m % 60, tz)
        if (startLocalMs < +fromTs) continue
        if (startLocalMs >= +toTs) break
        const endLocalMs = startLocalMs + duration * 60_000
        const bufferedEnd = endLocalMs + buffer * 60_000
        const overlap = busyRanges.some(b => !(bufferedEnd <= b.s || startLocalMs >= b.e))
        if (!overlap) {
          slots.push({
            startsAt: new Date(startLocalMs).toISOString(),
            endsAt: new Date(endLocalMs).toISOString(),
          })
          if (slots.length >= maxSlots) return slots
        }
      }
    }

    // Advance to next local midnight.
    dayCursor = new Date(
      tzLocalDateToUtcMs(localDay.y, localDay.mo, localDay.d, 0, 0, tz) + 86_400_000,
    )
  }
  return slots
}

interface LocalDayParts { y: number; mo: number; d: number; weekday: number }

function localYMDW(at: Date, tz: string): LocalDayParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).formatToParts(at)
  const g: Record<string, string> = {}
  for (const p of parts) g[p.type] = p.value
  const WD: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return {
    y: Number(g.year),
    mo: Number(g.month),
    d: Number(g.day),
    weekday: WD[g.weekday] ?? 0,
  }
}

// Convert a local wall-clock (y, mo, d, h, mi) in `tz` to UTC milliseconds.
function tzLocalDateToUtcMs(
  y: number, mo: number, d: number, h: number, mi: number, tz: string,
): number {
  const utcGuess = Date.UTC(y, mo - 1, d, h, mi, 0, 0)
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(utcGuess))
  const g: Record<string, string> = {}
  for (const p of fmt) g[p.type] = p.value
  const seenH = Number(g.hour === '24' ? '0' : g.hour)
  const seenUtc = Date.UTC(Number(g.year), Number(g.month) - 1, Number(g.day), seenH, Number(g.minute), 0, 0)
  const tzOffsetMs = seenUtc - utcGuess
  return utcGuess - tzOffsetMs
}
